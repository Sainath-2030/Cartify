import json
import os
from typing import Dict, List, Tuple, Set
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, TensorDataset

from common.db import get_db_connection
from fusion.config import (
    NCF_MODEL_PATH,
    NCF_ID_MAP_PATH,
    CNN_ID_MAP_PATH,
    CNN_EMBEDDINGS_PATH,
    GRU_MODEL_PATH,
    GRU_ID_MAP_PATH,
    AUTOENCODER_MODEL_PATH,
    AUTOENCODER_ID_MAP_PATH,
    AUTOENCODER_LATENT_PATH,
    NCF_DIM,
    CNN_DIM,
    GRU_DIM,
    AUTOENCODER_DIM,
)


class MultiModalFeatureExtractor:
    """
    Loads pretrained artifacts for NCF, CNN, GRU, and Autoencoder,
    and extracts aligned multi-modal feature vectors for any (user, item) pair.
    """
    def __init__(self, device: str = "cpu"):
        self.device = torch.device(device)
        self._load_ncf()
        self._load_cnn()
        self._load_gru()
        self._load_autoencoder()

    def _load_ncf(self):
        """Loads NCF embeddings for users and items."""
        if os.path.exists(NCF_ID_MAP_PATH):
            with open(NCF_ID_MAP_PATH, "r", encoding="utf-8") as f:
                maps = json.load(f)
                self.ncf_user_to_idx = {int(k): v for k, v in maps.get("user_to_idx", {}).items()}
                self.ncf_item_to_idx = {int(k): v for k, v in maps.get("item_to_idx", {}).items()}
        else:
            self.ncf_user_to_idx, self.ncf_item_to_idx = {}, {}

        if os.path.exists(NCF_MODEL_PATH):
            ckpt = torch.load(NCF_MODEL_PATH, map_location=self.device)
            state = ckpt.get("model_state_dict", ckpt)
            # Concatenate GMF (32) and MLP (32) embeddings -> 64-dim
            u_gmf = state["user_embedding_gmf.weight"].cpu().numpy()
            u_mlp = state["user_embedding_mlp.weight"].cpu().numpy()
            self.ncf_user_embeddings = np.concatenate([u_gmf, u_mlp], axis=-1)

            i_gmf = state["item_embedding_gmf.weight"].cpu().numpy()
            i_mlp = state["item_embedding_mlp.weight"].cpu().numpy()
            self.ncf_item_embeddings = np.concatenate([i_gmf, i_mlp], axis=-1)
        else:
            self.ncf_user_embeddings = np.zeros((1, NCF_DIM), dtype=np.float32)
            self.ncf_item_embeddings = np.zeros((1, NCF_DIM), dtype=np.float32)

    def _load_cnn(self):
        """Loads ResNet18 visual embeddings and product ID mapping."""
        if os.path.exists(CNN_ID_MAP_PATH):
            with open(CNN_ID_MAP_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                pids = data.get("index_to_product_id", [])
                self.cnn_item_to_idx = {int(pid): idx for idx, pid in enumerate(pids)}
        else:
            self.cnn_item_to_idx = {}

        if os.path.exists(CNN_EMBEDDINGS_PATH):
            self.cnn_embeddings = np.load(CNN_EMBEDDINGS_PATH)
            self.cnn_mean_embedding = np.mean(self.cnn_embeddings, axis=0)
        else:
            self.cnn_embeddings = np.zeros((1, CNN_DIM), dtype=np.float32)
            self.cnn_mean_embedding = np.zeros(CNN_DIM, dtype=np.float32)

    def _load_gru(self):
        """Loads GRU session network embeddings."""
        if os.path.exists(GRU_ID_MAP_PATH):
            with open(GRU_ID_MAP_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.gru_item_to_idx = {int(k): v for k, v in data.get("item_to_idx", {}).items()}
        else:
            self.gru_item_to_idx = {}

        if os.path.exists(GRU_MODEL_PATH):
            state = torch.load(GRU_MODEL_PATH, map_location=self.device)
            self.gru_item_embeddings = state["item_embedding.weight"].cpu().numpy()
            self.gru_mean_item = np.mean(self.gru_item_embeddings, axis=0)
        else:
            self.gru_item_embeddings = np.zeros((1, GRU_DIM), dtype=np.float32)
            self.gru_mean_item = np.zeros(GRU_DIM, dtype=np.float32)

    def _load_autoencoder(self):
        """Loads CDAE latent representations and mapping."""
        if os.path.exists(AUTOENCODER_ID_MAP_PATH):
            with open(AUTOENCODER_ID_MAP_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.ae_user_to_idx = {int(k): v for k, v in data.get("user_to_idx", {}).items()}
                self.ae_item_to_idx = {int(k): v for k, v in data.get("item_to_idx", {}).items()}
        else:
            self.ae_user_to_idx, self.ae_item_to_idx = {}, {}

        if os.path.exists(AUTOENCODER_LATENT_PATH):
            self.ae_latent_embeddings = np.load(AUTOENCODER_LATENT_PATH)
            self.ae_mean_latent = np.mean(self.ae_latent_embeddings, axis=0)
        else:
            self.ae_latent_embeddings = np.zeros((1, AUTOENCODER_DIM), dtype=np.float32)
            self.ae_mean_latent = np.zeros(AUTOENCODER_DIM, dtype=np.float32)

        if os.path.exists(AUTOENCODER_MODEL_PATH):
            state = torch.load(AUTOENCODER_MODEL_PATH, map_location=self.device)
            enc_w = state["encoder.0.weight"].cpu().numpy().T  # (num_items, 256)
            enc2_w = state["encoder.3.weight"].cpu().numpy().T # (256, 64)
            self.ae_item_proj = np.matmul(enc_w, enc2_w)      # (num_items, 64)
        else:
            self.ae_item_proj = np.zeros((1, AUTOENCODER_DIM), dtype=np.float32)

    def get_ncf_feature(self, user_id: int, product_id: int) -> np.ndarray:
        """Computes collaborative user-item alignment feature (64-dim)."""
        u_idx = self.ncf_user_to_idx.get(user_id)
        i_idx = self.ncf_item_to_idx.get(product_id)

        u_vec = self.ncf_user_embeddings[u_idx] if (u_idx is not None and u_idx < len(self.ncf_user_embeddings)) else np.zeros(NCF_DIM, dtype=np.float32)
        i_vec = self.ncf_item_embeddings[i_idx] if (i_idx is not None and i_idx < len(self.ncf_item_embeddings)) else np.zeros(NCF_DIM, dtype=np.float32)
        
        u_norm = np.linalg.norm(u_vec)
        i_norm = np.linalg.norm(i_vec)
        if u_norm > 1e-8:
            u_vec = u_vec / u_norm
        if i_norm > 1e-8:
            i_vec = i_vec / i_norm
        return (u_vec * i_vec).astype(np.float32)

    def get_cnn_feature(self, product_id: int) -> np.ndarray:
        """Retrieves ResNet18 visual embedding (256-dim)."""
        c_idx = self.cnn_item_to_idx.get(product_id)
        if c_idx is not None and c_idx < len(self.cnn_embeddings):
            feat = self.cnn_embeddings[c_idx].astype(np.float32)
        else:
            feat = self.cnn_mean_embedding.astype(np.float32)
        norm = np.linalg.norm(feat)
        if norm > 1e-8:
            feat = feat / norm
        return feat

    def get_gru_feature(self, user_id: int, session_sequence: List[int], product_id: int) -> np.ndarray:
        """Computes session sequence affinity vector (64-dim)."""
        target_idx = self.gru_item_to_idx.get(product_id)
        target_vec = self.gru_item_embeddings[target_idx] if (target_idx is not None and target_idx < len(self.gru_item_embeddings)) else self.gru_mean_item

        seq_vecs = [self.gru_item_embeddings[self.gru_item_to_idx[pid]] for pid in session_sequence[-5:] if pid in self.gru_item_to_idx and self.gru_item_to_idx[pid] < len(self.gru_item_embeddings)]
        session_context = np.mean(seq_vecs, axis=0) if seq_vecs else self.gru_mean_item

        tgt_norm = np.linalg.norm(target_vec)
        ctx_norm = np.linalg.norm(session_context)
        if tgt_norm > 1e-8:
            target_vec = target_vec / tgt_norm
        if ctx_norm > 1e-8:
            session_context = session_context / ctx_norm

        return (session_context * target_vec).astype(np.float32)

    def get_autoencoder_feature(self, user_id: int, product_id: int) -> np.ndarray:
        """Computes latent manifold preference vector (64-dim)."""
        u_idx = self.ae_user_to_idx.get(user_id)
        u_latent = self.ae_latent_embeddings[u_idx] if (u_idx is not None and u_idx < len(self.ae_latent_embeddings)) else self.ae_mean_latent

        i_idx = self.ae_item_to_idx.get(product_id)
        i_latent = self.ae_item_proj[i_idx] if (i_idx is not None and i_idx < len(self.ae_item_proj)) else np.zeros(AUTOENCODER_DIM, dtype=np.float32)

        u_norm = np.linalg.norm(u_latent)
        i_norm = np.linalg.norm(i_latent)
        if u_norm > 1e-8:
            u_latent = u_latent / u_norm
        if i_norm > 1e-8:
            i_latent = i_latent / i_norm

        return (u_latent * i_latent).astype(np.float32)


def fetch_training_interactions() -> Tuple[pd.DataFrame, Dict[int, List[int]], Set[int]]:
    conn = get_db_connection()
    try:
        query = """
        SELECT user_id, product_id, session_id, interaction_type, created_at
        FROM interactions
        WHERE user_id IS NOT NULL AND product_id IS NOT NULL
        ORDER BY created_at ASC;
        """
        df = pd.read_sql(query, conn)
    finally:
        conn.close()

    user_sessions: Dict[int, List[int]] = {}
    all_products: Set[int] = set(df["product_id"].unique())

    for _, row in df.iterrows():
        uid = int(row["user_id"])
        pid = int(row["product_id"])
        if uid not in user_sessions:
            user_sessions[uid] = []
        user_sessions[uid].append(pid)

    return df, user_sessions, all_products


def build_precomputed_tensor_datasets(
    interactions_df: pd.DataFrame,
    user_sessions: Dict[int, List[int]],
    all_products: Set[int],
    extractor: MultiModalFeatureExtractor,
    num_negatives: int = 2,
    val_ratio: float = 0.15,
) -> Tuple[TensorDataset, TensorDataset]:
    """
    Precomputes the multi-modal tensors once in memory for ultra-fast GPU/CPU batching.
    """
    prod_list = list(all_products)
    samples = []

    for uid, history in user_sessions.items():
        interacted_set = set(history)
        for i, pid in enumerate(history):
            curr_seq = history[max(0, i - 5): i]
            samples.append((uid, pid, 1.0, curr_seq))
            for _ in range(num_negatives):
                neg_pid = np.random.choice(prod_list)
                while neg_pid in interacted_set and len(prod_list) > len(interacted_set):
                    neg_pid = np.random.choice(prod_list)
                samples.append((uid, int(neg_pid), 0.0, curr_seq))

    np.random.shuffle(samples)
    N = len(samples)

    ncf_arr = np.zeros((N, NCF_DIM), dtype=np.float32)
    cnn_arr = np.zeros((N, CNN_DIM), dtype=np.float32)
    gru_arr = np.zeros((N, GRU_DIM), dtype=np.float32)
    ae_arr  = np.zeros((N, AUTOENCODER_DIM), dtype=np.float32)
    label_arr = np.zeros(N, dtype=np.float32)

    for i, (uid, pid, label, curr_seq) in enumerate(samples):
        ncf_arr[i] = extractor.get_ncf_feature(uid, pid)
        cnn_arr[i] = extractor.get_cnn_feature(pid)
        gru_arr[i] = extractor.get_gru_feature(uid, curr_seq, pid)
        ae_arr[i]  = extractor.get_autoencoder_feature(uid, pid)
        label_arr[i] = label

    split_idx = int(N * (1.0 - val_ratio))

    train_ds = TensorDataset(
        torch.from_numpy(ncf_arr[:split_idx]),
        torch.from_numpy(cnn_arr[:split_idx]),
        torch.from_numpy(gru_arr[:split_idx]),
        torch.from_numpy(ae_arr[:split_idx]),
        torch.from_numpy(label_arr[:split_idx]),
    )

    val_ds = TensorDataset(
        torch.from_numpy(ncf_arr[split_idx:]),
        torch.from_numpy(cnn_arr[split_idx:]),
        torch.from_numpy(gru_arr[split_idx:]),
        torch.from_numpy(ae_arr[split_idx:]),
        torch.from_numpy(label_arr[split_idx:]),
    )

    return train_ds, val_ds, N
