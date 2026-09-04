"""
Turns raw Cartify interactions into the (user, item, label) implicit-feedback
format NCF trains on, plus leave-one-out train/test split.

Cartify's real `id` columns (users.id, products.id) are used directly as the
raw IDs, then remapped to a dense 0..N-1 index range required by
nn.Embedding. The mapping is saved so inference can translate back and forth
— this is what keeps product IDs stable per CLAUDE.MD Section 29 ("Keep
product IDs stable. Never randomly map unrelated product IDs.").
"""
import json
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset

from ncf.config import (
    INTERACTION_WEIGHTS,
    DEFAULT_WEIGHT,
    NEGATIVE_SAMPLES_PER_POSITIVE,
    RANDOM_SEED,
)


def build_id_maps(interactions: pd.DataFrame):
    user_ids = sorted(interactions["user_id"].unique())
    item_ids = sorted(interactions["product_id"].unique())
    user_to_idx = {uid: i for i, uid in enumerate(user_ids)}
    item_to_idx = {pid: i for i, pid in enumerate(item_ids)}
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


def weight_of(interaction_type: str) -> int:
    if not interaction_type:
        return DEFAULT_WEIGHT
    return INTERACTION_WEIGHTS.get(str(interaction_type).strip().lower(), DEFAULT_WEIGHT)


def prepare_positive_pairs(interactions: pd.DataFrame, user_to_idx, item_to_idx) -> pd.DataFrame:
    df = interactions.copy()
    df["user_idx"] = df["user_id"].map(user_to_idx)
    df["item_idx"] = df["product_id"].map(item_to_idx)
    df["weight"] = df["interaction_type"].map(weight_of)

    # Collapse repeated events for the same (user, item) into one positive,
    # keeping the strongest signal (e.g. a later 'purchase' beats an earlier 'view').
    positives = (
        df.sort_values("created_at")
        .groupby(["user_idx", "item_idx"], as_index=False)
        .agg(weight=("weight", "max"), created_at=("created_at", "last"))
    )
    return positives


def leave_one_out_split(positives: pd.DataFrame):
    """Holds out each user's most recent interaction for eval, rest for train."""
    positives = positives.sort_values("created_at")
    test_idx = positives.groupby("user_idx").tail(1).index
    test = positives.loc[test_idx]
    train = positives.drop(test_idx)
    if train.empty:
        # If very few interactions per user, retain all in train for learning
        train = positives.copy()
    return train.reset_index(drop=True), test.reset_index(drop=True)


class NCFDataset(Dataset):
    """
    Implicit-feedback dataset with per-epoch negative sampling.
    For every positive (user, item) pair, sample `n_negatives` items the
    user has NOT interacted with, labeled 0.
    """

    def __init__(self, positives: pd.DataFrame, num_items: int, user_positive_items: dict,
                 n_negatives: int = NEGATIVE_SAMPLES_PER_POSITIVE, seed: int = RANDOM_SEED):
        self.positives = positives.reset_index(drop=True)
        self.num_items = num_items
        self.user_positive_items = user_positive_items  # user_idx -> set(item_idx)
        self.n_negatives = n_negatives
        self.rng = np.random.default_rng(seed)
        self._samples = None
        self.resample()

    def resample(self):
        """Call once per epoch from the training loop to refresh negatives."""
        users, items, labels = [], [], []
        for row in self.positives.itertuples():
            users.append(row.user_idx)
            items.append(row.item_idx)
            labels.append(1.0)

            seen = self.user_positive_items.get(row.user_idx, set())
            unseen = [cand for cand in range(self.num_items) if cand not in seen]
            if unseen:
                num_to_sample = min(self.n_negatives, len(unseen))
                sampled_negs = self.rng.choice(unseen, size=num_to_sample, replace=(len(unseen) < self.n_negatives))
                for cand in sampled_negs:
                    users.append(row.user_idx)
                    items.append(int(cand))
                    labels.append(0.0)

        self._samples = (
            torch.tensor(users, dtype=torch.long),
            torch.tensor(items, dtype=torch.long),
            torch.tensor(labels, dtype=torch.float32),
        )

    def __len__(self):
        return len(self._samples[0])

    def __getitem__(self, idx):
        users, items, labels = self._samples
        return users[idx], items[idx], labels[idx]


def build_user_positive_items(positives: pd.DataFrame) -> dict:
    out = {}
    for user_idx, group in positives.groupby("user_idx"):
        out[user_idx] = set(group["item_idx"].tolist())
    return out
