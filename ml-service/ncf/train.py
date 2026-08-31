"""
Trains NCF on Cartify's real interactions table and saves a checkpoint +
id-mapping file under ml-service/artifacts/.

Run from ml-service/:
    python -m ncf.train

This does NOT touch server/ or the Node API. It is a standalone offline
training job, consistent with CLAUDE.MD's "Recommendation Service" being a
separate layer from Node/Express (Section 2, PLANNED architecture).
"""
import os
import torch
from torch.utils.data import DataLoader

from common.db import load_interactions
from ncf.config import BATCH_SIZE, EPOCHS, LEARNING_RATE, WEIGHT_DECAY, RANDOM_SEED
from ncf.dataset import (
    build_id_maps,
    save_id_maps,
    prepare_positive_pairs,
    leave_one_out_split,
    build_user_positive_items,
    NCFDataset,
)
from ncf.model import NCF

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")


def hit_rate_at_k(model, test_df, user_positive_items, num_items, k=10, n_candidates=99, device="cpu"):
    n_candidates = min(n_candidates, num_items - 1)
    """
    Standard implicit-feedback eval: for each held-out (user, item) pair,
    rank it against `n_candidates` random unseen items. Count a hit if the
    true item lands in the top-k.
    """
    import numpy as np
    rng = np.random.default_rng(RANDOM_SEED)
    hits = 0
    model.eval()
    with torch.no_grad():
        for row in test_df.itertuples():
            seen = user_positive_items.get(row.user_idx, set())
            candidates = [row.item_idx]
            while len(candidates) < n_candidates + 1:
                cand = int(rng.integers(0, num_items))
                if cand in seen or cand in candidates:
                    continue
                candidates.append(cand)

            user_tensor = torch.tensor([row.user_idx] * len(candidates), device=device)
            item_tensor = torch.tensor(candidates, device=device)
            scores = model(user_tensor, item_tensor).cpu().numpy()

            top_k_idx = scores.argsort()[::-1][:k]
            if 0 in top_k_idx:  # true item is always at index 0
                hits += 1
    return hits / max(len(test_df), 1)


def main():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print("Loading interactions from Postgres... - train.py:66")
    interactions = load_interactions()
    if interactions.empty:
        raise SystemExit(
            "No interactions found. NCF needs real interaction data — "
            "Section 4 (Recommendation Data Pipeline) is a prerequisite for "
            "meaningful training, per CLAUDE.MD's documented section order."
        )

    user_to_idx, item_to_idx = build_id_maps(interactions)
    save_id_maps(user_to_idx, item_to_idx, os.path.join(ARTIFACTS_DIR, "ncf_id_maps.json"))
    num_users, num_items = len(user_to_idx), len(item_to_idx)
    print(f"num_users={num_users} num_items={num_items} - train.py:78")

    positives = prepare_positive_pairs(interactions, user_to_idx, item_to_idx)
    train_df, test_df = leave_one_out_split(positives)
    user_positive_items = build_user_positive_items(positives)

    train_dataset = NCFDataset(train_df, num_items, user_positive_items)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)

    model = NCF(num_users, num_items).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    criterion = torch.nn.BCELoss()

    for epoch in range(1, EPOCHS + 1):
        train_dataset.resample()  # fresh negatives each epoch
        model.train()
        total_loss = 0.0
        for users, items, labels in train_loader:
            users, items, labels = users.to(device), items.to(device), labels.to(device)
            optimizer.zero_grad()
            preds = model(users, items)
            loss = criterion(preds, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * len(labels)

        avg_loss = total_loss / len(train_dataset)
        hr10 = hit_rate_at_k(model, test_df, user_positive_items, num_items, k=10, device=device)
        print(f"epoch {epoch:02d}/{EPOCHS}  loss={avg_loss:.4f}  HR@10={hr10:.4f} - train.py:106")

    checkpoint_path = os.path.join(ARTIFACTS_DIR, "ncf_model.pt")
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "num_users": num_users,
            "num_items": num_items,
        },
        checkpoint_path,
    )
    print(f"Saved checkpoint to {checkpoint_path} - train.py:117")


if __name__ == "__main__":
    main()
