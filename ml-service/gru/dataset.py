import json
import torch
from torch.utils.data import Dataset
import pandas as pd
import numpy as np

def build_id_maps(interactions: pd.DataFrame):
    item_ids = sorted(interactions["product_id"].unique())
    # 0 is padding, so we map product_id to 1..N
    item_to_idx = {pid: i + 1 for i, pid in enumerate(item_ids)}
    user_ids = sorted(interactions["user_id"].unique())
    user_to_idx = {uid: i for i, uid in enumerate(user_ids)}
    return user_to_idx, item_to_idx

def save_id_maps(user_to_idx: dict, item_to_idx: dict, path: str):
    with open(path, "w") as f:
        json.dump(
            {
                "user_to_idx": {str(k): v for k, v in user_to_idx.items()},
                "item_to_idx": {str(k): v for k, v in item_to_idx.items()},
            },
            f,
        )

def load_id_maps(path: str):
    with open(path, "r") as f:
        data = json.load(f)
    user_to_idx = {int(k): v for k, v in data["user_to_idx"].items()}
    item_to_idx = {int(k): v for k, v in data["item_to_idx"].items()}
    return user_to_idx, item_to_idx

class GRUSessionDataset(Dataset):
    def __init__(self, sequences, max_len):
        self.sequences = sequences
        self.max_len = max_len

    def __len__(self):
        return len(self.sequences)

    def __getitem__(self, idx):
        seq = self.sequences[idx]
        # Target is the last item in the sequence
        target = seq[-1]
        
        # Input sequence is everything except the last item
        input_seq = seq[:-1]
        
        # Pad or truncate input_seq to max_len
        if len(input_seq) > self.max_len:
            input_seq = input_seq[-self.max_len:]
        
        pad_len = self.max_len - len(input_seq)
        padded_seq = [0] * pad_len + input_seq
        seq_length = max(1, len(input_seq))
        
        return torch.tensor(padded_seq, dtype=torch.long), torch.tensor(target, dtype=torch.long), torch.tensor(seq_length, dtype=torch.long)

def prepare_session_sequences(interactions: pd.DataFrame, item_to_idx: dict):
    df = interactions.copy()
    df["item_idx"] = df["product_id"].map(item_to_idx)
    
    # Sort chronologically by session and created_at
    df = df.sort_values(by=["session_id", "created_at"])
    
    sequences = []
    for session_id, group in df.groupby("session_id"):
        items = [x for x in group["item_idx"].tolist() if pd.notna(x)]
        if len(items) >= 2:
            # Sub-sequence prefix augmentation:
            # [i1, i2, i3, i4] generates prefixes:
            # [i1, i2], [i1, i2, i3], [i1, i2, i3, i4]
            for k in range(2, len(items) + 1):
                sequences.append(items[:k])
            
    return sequences

def train_test_split_sequences(sequences):
    np.random.shuffle(sequences)
    split_idx = int(len(sequences) * 0.9)
    return sequences[:split_idx], sequences[split_idx:]
