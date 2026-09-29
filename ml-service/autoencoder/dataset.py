import json
import torch
from torch.utils.data import Dataset
import pandas as pd
import numpy as np

def build_id_maps(interactions: pd.DataFrame):
    """
    Builds zero-indexed contiguous ID mappings for users and items.
    """
    user_ids = sorted(interactions["user_id"].dropna().unique())
    user_to_idx = {int(uid): i for i, uid in enumerate(user_ids)}
    
    item_ids = sorted(interactions["product_id"].dropna().unique())
    item_to_idx = {int(pid): i for i, pid in enumerate(item_ids)}
    
    return user_to_idx, item_to_idx

def save_id_maps(user_to_idx: dict, item_to_idx: dict, path: str):
    """
    Serializes ID mappings to JSON.
    """
    with open(path, "w") as f:
        json.dump(
            {
                "user_to_idx": {str(k): v for k, v in user_to_idx.items()},
                "item_to_idx": {str(k): v for k, v in item_to_idx.items()},
            },
            f,
            indent=2
        )

def load_id_maps(path: str):
    """
    Loads ID mappings from JSON.
    """
    with open(path, "r") as f:
        data = json.load(f)
    user_to_idx = {int(k): v for k, v in data["user_to_idx"].items()}
    item_to_idx = {int(k): v for k, v in data["item_to_idx"].items()}
    return user_to_idx, item_to_idx

def build_interaction_matrix(interactions: pd.DataFrame, user_to_idx: dict, item_to_idx: dict, weights: dict) -> np.ndarray:
    """
    Constructs a normalized dense interaction matrix of shape (num_users, num_items)
    from event telemetry weights.
    """
    num_users = len(user_to_idx)
    num_items = len(item_to_idx)
    matrix = np.zeros((num_users, num_items), dtype=np.float32)

    for _, row in interactions.iterrows():
        uid = row["user_id"]
        pid = row["product_id"]
        itype = str(row.get("interaction_type", "VIEW")).upper()
        
        if pd.isna(uid) or pd.isna(pid):
            continue
            
        uid = int(uid)
        pid = int(pid)
        
        if uid in user_to_idx and pid in item_to_idx:
            u_idx = user_to_idx[uid]
            i_idx = item_to_idx[pid]
            weight = weights.get(itype, 1.0)
            matrix[u_idx, i_idx] += weight

    # Normalize observed interaction values to [0.0, 1.0] per user
    for u in range(num_users):
        max_val = matrix[u].max()
        if max_val > 0:
            # S-curve / log scaling for gentle gradient across multiple interactions
            matrix[u] = np.log1p(matrix[u]) / np.log1p(max_val)

    return matrix

class AutoencoderDataset(Dataset):
    """
    PyTorch Dataset returning user interaction profile vectors and corresponding user index.
    """
    def __init__(self, matrix: np.ndarray, user_indices: list = None):
        self.matrix = matrix
        self.user_indices = user_indices if user_indices is not None else list(range(len(matrix)))

    def __len__(self):
        return len(self.user_indices)

    def __getitem__(self, idx):
        u_idx = self.user_indices[idx]
        profile = self.matrix[u_idx]
        return torch.tensor(profile, dtype=torch.float32), torch.tensor(u_idx, dtype=torch.long)

