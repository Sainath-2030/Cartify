import json
import os
import random
import time
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

from fusion.config import (
    BATCH_SIZE,
    LEARNING_RATE,
    WEIGHT_DECAY,
    EPOCHS,
    RANDOM_SEED,
    FUSION_MODEL_PATH,
    FUSION_METADATA_PATH,
    MODALITIES,
)
from fusion.dataset import (
    MultiModalFeatureExtractor,
    fetch_training_interactions,
    build_precomputed_tensor_datasets,
)
from fusion.model import AttentionFusion


def set_seed(seed: int = RANDOM_SEED):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def train():
    set_seed()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"=== Training Attention Fusion Layer (Section 9) on {device} ===", flush=True)

    print("Loading pretrained base model artifacts (NCF, CNN, GRU, Autoencoder)...", flush=True)
    extractor = MultiModalFeatureExtractor(device=str(device))
    print("Pretrained base models successfully loaded into memory.", flush=True)

    print("Fetching interactions from PostgreSQL...", flush=True)
    interactions_df, user_sessions, all_products = fetch_training_interactions()
    print(f"Loaded {len(interactions_df)} interactions across {len(user_sessions)} users and {len(all_products)} products.", flush=True)

    if interactions_df.empty:
        print("Error: No interactions found in PostgreSQL. Aborting training.", flush=True)
        return

    print("Precomputing multi-modal feature tensors in memory...", flush=True)
    train_dataset, val_dataset, total_samples = build_precomputed_tensor_datasets(
        interactions_df, user_sessions, all_products, extractor, num_negatives=2, val_ratio=0.15
    )
    print(f"Generated {total_samples} multi-modal training pairs (Train: {len(train_dataset)}, Val: {len(val_dataset)}).", flush=True)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    model = AttentionFusion().to(device)
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    criterion = nn.BCELoss()

    best_val_loss = float("inf")
    history = []

    print("\nStarting Attention Fusion optimization loop...", flush=True)
    start_time = time.time()

    for epoch in range(1, EPOCHS + 1):
        model.train()
        train_loss = 0.0
        train_batches = 0
        epoch_attentions = []

        for ncf_feat, cnn_feat, gru_feat, ae_feat, labels in train_loader:
            ncf_feat = ncf_feat.to(device)
            cnn_feat = cnn_feat.to(device)
            gru_feat = gru_feat.to(device)
            ae_feat = ae_feat.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            scores, att_weights = model(ncf_feat, cnn_feat, gru_feat, ae_feat)
            loss = criterion(scores, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            train_batches += 1
            epoch_attentions.append(att_weights.detach().cpu().numpy())

        avg_train_loss = train_loss / max(1, train_batches)
        mean_att = np.concatenate(epoch_attentions, axis=0).mean(axis=0)

        # Validation
        model.eval()
        val_loss = 0.0
        val_batches = 0
        correct = 0
        total = 0

        with torch.no_grad():
            for ncf_feat, cnn_feat, gru_feat, ae_feat, labels in val_loader:
                ncf_feat = ncf_feat.to(device)
                cnn_feat = cnn_feat.to(device)
                gru_feat = gru_feat.to(device)
                ae_feat = ae_feat.to(device)
                labels = labels.to(device)

                scores, _ = model(ncf_feat, cnn_feat, gru_feat, ae_feat)
                loss = criterion(scores, labels)
                val_loss += loss.item()
                val_batches += 1

                preds = (scores >= 0.5).float()
                correct += (preds == labels).sum().item()
                total += labels.size(0)

        avg_val_loss = val_loss / max(1, val_batches)
        val_accuracy = (correct / total) if total > 0 else 0.0

        att_str = ", ".join([f"{m}: {w:.1%}" for m, w in zip(MODALITIES, mean_att)])
        if epoch % 5 == 0 or epoch == 1 or epoch == EPOCHS:
            print(f"Epoch [{epoch:02d}/{EPOCHS:02d}] - Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f} | Val Acc: {val_accuracy:.1%} | Weights: [{att_str}]", flush=True)

        history.append({
            "epoch": epoch,
            "trainLoss": round(avg_train_loss, 4),
            "valLoss": round(avg_val_loss, 4),
            "valAccuracy": round(val_accuracy, 4),
            "meanAttention": {m: round(float(w), 4) for m, w in zip(MODALITIES, mean_att)},
        })

        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            os.makedirs(os.path.dirname(FUSION_MODEL_PATH), exist_ok=True)
            torch.save(model.state_dict(), FUSION_MODEL_PATH)

    elapsed = round(time.time() - start_time, 2)
    print(f"\nTraining completed in {elapsed}s. Best Val Loss: {best_val_loss:.4f}", flush=True)
    print(f"Model saved to: {FUSION_MODEL_PATH}", flush=True)

    # Compute final metadata
    final_att = history[-1]["meanAttention"]
    metadata = {
        "modelName": "Attention Fusion Layer",
        "version": "v1.0.0-trained",
        "trainedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "trainingDurationSeconds": elapsed,
        "epochs": EPOCHS,
        "totalSamples": total_samples,
        "bestValLoss": round(best_val_loss, 4),
        "finalAccuracy": history[-1]["valAccuracy"],
        "modalities": MODALITIES,
        "meanAttentionWeights": final_att,
        "history": history[-5:],
    }

    with open(FUSION_METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Metadata saved to: {FUSION_METADATA_PATH}", flush=True)


if __name__ == "__main__":
    train()
