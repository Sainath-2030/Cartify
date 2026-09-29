import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader
import numpy as np
import pandas as pd

from common.db import get_db_connection
from autoencoder.config import (
    LATENT_DIM,
    HIDDEN_DIM,
    DROPOUT_CORRUPTION,
    BATCH_SIZE,
    LEARNING_RATE,
    WEIGHT_DECAY,
    RANDOM_SEED,
    INTERACTION_WEIGHTS,
    ID_MAP_PATH,
    MODEL_PATH,
    LATENT_PATH,
)
from autoencoder.dataset import (
    build_id_maps,
    save_id_maps,
    build_interaction_matrix,
    AutoencoderDataset,
)
from autoencoder.model import DenoisingAutoencoder

EPOCHS = 45
POSITIVE_WEIGHT = 15.0

def get_interactions():
    conn = get_db_connection()
    query = """
    SELECT user_id, product_id, session_id, interaction_type, created_at
    FROM interactions
    WHERE user_id IS NOT NULL AND product_id IS NOT NULL
    ORDER BY created_at ASC
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def train():
    torch.manual_seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)

    print("Fetching interactions from PostgreSQL...")
    interactions = get_interactions()
    print(f"Loaded {len(interactions)} interactions.")

    if interactions.empty:
        print("No interactions found in database. Exiting.")
        return

    # Build and save contiguous ID maps
    user_to_idx, item_to_idx = build_id_maps(interactions)
    os.makedirs(os.path.dirname(ID_MAP_PATH), exist_ok=True)
    save_id_maps(user_to_idx, item_to_idx, ID_MAP_PATH)

    num_users = len(user_to_idx)
    num_items = len(item_to_idx)
    print(f"Mapped {num_users} unique users and {num_items} unique items.")

    # Build interaction matrix
    matrix = build_interaction_matrix(interactions, user_to_idx, item_to_idx, INTERACTION_WEIGHTS)
    sparsity = 100.0 * (1.0 - (np.count_nonzero(matrix) / (num_users * num_items)))
    print(f"Constructed interaction matrix: {matrix.shape} (Sparsity: {sparsity:.2f}%)")

    # Train / Val user indices
    all_indices = list(range(num_users))
    np.random.shuffle(all_indices)
    split_point = max(1, int(num_users * 0.85))
    train_indices = all_indices[:split_point]
    val_indices = all_indices[split_point:] if split_point < num_users else all_indices

    train_dataset = AutoencoderDataset(matrix, train_indices)
    val_dataset = AutoencoderDataset(matrix, val_indices)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    model = DenoisingAutoencoder(
        num_users=num_users,
        num_items=num_items,
        hidden_dim=HIDDEN_DIM,
        latent_dim=LATENT_DIM,
        corruption_prob=DROPOUT_CORRUPTION,
    ).to(device)

    optimizer = optim.Adam(model.parameters(), lr=0.003, weight_decay=WEIGHT_DECAY)
    pos_weight = torch.tensor(POSITIVE_WEIGHT, device=device)

    best_val_loss = float("inf")
    print(f"Starting CDAE Autoencoder training ({EPOCHS} epochs, Latent Dim: {LATENT_DIM})...")

    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0.0

        for batch_x, batch_u in train_loader:
            batch_x = batch_x.to(device)
            batch_u = batch_u.to(device)
            optimizer.zero_grad()

            logits, latent = model(batch_x, user_indices=batch_u, corrupt=True)
            # Binary Cross Entropy with positive class boost to penalize false negatives on user history
            targets = (batch_x > 0).float()
            loss = F.binary_cross_entropy_with_logits(logits, targets, pos_weight=pos_weight)

            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        train_loss /= max(1, len(train_loader))

        # Validation loop
        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for val_x, val_u in val_loader:
                val_x = val_x.to(device)
                val_u = val_u.to(device)
                logits, _ = model(val_x, user_indices=val_u, corrupt=False)
                targets = (val_x > 0).float()
                v_loss = F.binary_cross_entropy_with_logits(logits, targets, pos_weight=pos_weight)
                val_loss += v_loss.item()

        val_loss /= max(1, len(val_loader))

        if (epoch + 1) % 5 == 0 or epoch == 0 or (epoch + 1) == EPOCHS:
            print(f"Epoch [{epoch+1:02d}/{EPOCHS:02d}] | Train Loss: {train_loss:.5f} | Val Loss: {val_loss:.5f}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
            torch.save(model.state_dict(), MODEL_PATH)

    print(f"Best model checkpoint saved to {MODEL_PATH} (Val Loss: {best_val_loss:.5f})")

    # Generate and save dense 64-dim latent embeddings for all users
    print("Generating dense 64-dimensional latent user embeddings...")
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()
    with torch.no_grad():
        all_tensor = torch.tensor(matrix, dtype=torch.float32).to(device)
        all_users = torch.tensor(list(range(num_users)), dtype=torch.long).to(device)
        latent_embeddings = model.encode(all_tensor, user_indices=all_users).cpu().numpy()

    np.save(LATENT_PATH, latent_embeddings)
    print(f"Saved {latent_embeddings.shape} latent embeddings to {LATENT_PATH}")
    print("Autoencoder training pipeline completed successfully.")

if __name__ == "__main__":
    train()
