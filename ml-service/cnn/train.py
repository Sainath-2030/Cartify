"""
Trains CNN Image Feature Extractor projection head on Cartify product images.
Uses pretrained ResNet18 backbone with trainable 256-dim projection head
trained on product category supervision for visual content clustering.

Outputs:
  ml-service/artifacts/cnn_model.pt
  ml-service/artifacts/cnn_embeddings.npy
  ml-service/artifacts/cnn_id_map.json
"""
import os
import sys
import csv
import json
import time
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from cnn.model import ImageEmbeddingNet, get_transform, EMBEDDING_DIM
from common.db import get_db_connection

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "image_manifest.csv")
CHECKPOINT_PATH = os.path.join(ARTIFACTS_DIR, "cnn_model.pt")
EMBEDDINGS_PATH = os.path.join(ARTIFACTS_DIR, "cnn_embeddings.npy")
ID_MAP_PATH = os.path.join(ARTIFACTS_DIR, "cnn_id_map.json")

EPOCHS = 20
BATCH_SIZE = 32
LEARNING_RATE = 0.001


def get_product_categories(product_ids):
    """Fetch category IDs from PostgreSQL for product IDs."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, category_id FROM products WHERE id = ANY(%s)",
            (list(map(int, product_ids)),)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {str(r[0]): int(r[1]) for r in rows if r[1] is not None}
    except Exception as e:
        print(f"Warning: Could not fetch categories from DB: {e}. Using fallback labels.")
        return {}


def load_valid_manifest():
    if not os.path.exists(MANIFEST_PATH):
        raise FileNotFoundError(f"Manifest not found at {MANIFEST_PATH}. Run download_images.py first.")
    
    rows = []
    with open(MANIFEST_PATH, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if os.path.exists(row["image_path"]):
                rows.append(row)
    return rows


def main():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Initializing CNN training pipeline on {device}...")

    manifest = load_valid_manifest()
    print(f"Loaded {len(manifest)} valid images from manifest.")
    if not manifest:
        raise SystemExit("No valid images found on disk to train CNN.")

    product_ids = [r["product_id"] for r in manifest]
    cat_map = get_product_categories(product_ids)

    # Assign category index (0 to C-1)
    unique_cats = sorted(list(set(cat_map.values()))) if cat_map else [1]
    cat_to_idx = {cat: idx for idx, cat in enumerate(unique_cats)}
    num_classes = max(len(cat_to_idx), 2)

    # Instantiate base model
    model = ImageEmbeddingNet(freeze_backbone=True).to(device)
    transform = get_transform()

    print("Extracting frozen backbone feature maps (512-dim)...")
    feats_list = []
    labels_list = []
    valid_pids = []

    model.eval()
    start_time = time.time()
    
    # Process images in batches to extract 512-dim pooled features
    for i in range(0, len(manifest), BATCH_SIZE):
        batch = manifest[i:i + BATCH_SIZE]
        tensors = []
        batch_labels = []
        batch_ids = []

        for row in batch:
            try:
                img = Image.open(row["image_path"]).convert("RGB")
                tensors.append(transform(img))
                pid = str(row["product_id"])
                cat = cat_map.get(pid, unique_cats[0])
                batch_labels.append(cat_to_idx.get(cat, 0))
                batch_ids.append(pid)
            except Exception as e:
                print(f"Skipping {row['product_id']}: {e}")

        if not tensors:
            continue

        batch_t = torch.stack(tensors).to(device)
        with torch.no_grad():
            b_feats = model.backbone(batch_t)
            b_feats = torch.flatten(b_feats, 1)

        feats_list.append(b_feats.cpu())
        labels_list.extend(batch_labels)
        valid_pids.extend(batch_ids)

        if (i + BATCH_SIZE) % 200 == 0 or (i + BATCH_SIZE) >= len(manifest):
            print(f"  Processed {min(i + BATCH_SIZE, len(manifest))}/{len(manifest)} images...")

    all_feats = torch.cat(feats_list, dim=0)
    all_labels = torch.tensor(labels_list, dtype=torch.long)
    print(f"Backbone feature extraction complete in {time.time() - start_time:.2f}s. Shape: {all_feats.shape}")

    # Training projection head + classifier for semantic visual alignment
    projection = model.projection.to(device)
    classifier = nn.Linear(EMBEDDING_DIM, num_classes).to(device)

    dataset = TensorDataset(all_feats, all_labels)
    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

    optimizer = torch.optim.Adam(
        list(projection.parameters()) + list(classifier.parameters()),
        lr=LEARNING_RATE,
        weight_decay=1e-4
    )
    criterion = nn.CrossEntropyLoss()

    print(f"Training 256-dim projection head for {EPOCHS} epochs...")
    final_loss = 0.0
    final_acc = 0.0

    for epoch in range(1, EPOCHS + 1):
        projection.train()
        classifier.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for feats, labels in loader:
            feats, labels = feats.to(device), labels.to(device)
            optimizer.zero_grad()
            emb = projection(feats)
            logits = classifier(emb)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(labels)
            preds = logits.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += len(labels)

        avg_loss = total_loss / total
        acc = (correct / total) * 100.0
        final_loss = avg_loss
        final_acc = acc
        if epoch % 5 == 0 or epoch == 1 or epoch == EPOCHS:
            print(f"epoch {epoch:02d}/{EPOCHS}  loss={avg_loss:.4f}  acc={acc:.2f}%")

    # Save model checkpoint
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "projection_state_dict": projection.state_dict(),
            "embedding_dim": EMBEDDING_DIM,
            "backbone": "resnet18",
            "num_samples": len(valid_pids),
            "final_loss": round(final_loss, 4),
            "final_accuracy": round(final_acc, 2),
            "epochs": EPOCHS,
            "num_categories": num_classes,
        },
        CHECKPOINT_PATH
    )
    print(f"Saved CNN checkpoint to {CHECKPOINT_PATH}")

    # Generate and save final normalized 256-dim embeddings
    projection.eval()
    with torch.no_grad():
        all_embeddings = projection(all_feats.to(device)).cpu().numpy().astype(np.float32)

    # Save embeddings and ID map
    np.save(EMBEDDINGS_PATH, all_embeddings)
    with open(ID_MAP_PATH, "w") as f:
        json.dump({"index_to_product_id": valid_pids}, f)

    print(f"Saved embeddings {all_embeddings.shape} to {EMBEDDINGS_PATH}")
    print(f"Saved ID map ({len(valid_pids)} entries) to {ID_MAP_PATH}")
    print("CNN training and embedding extraction successfully completed!")


if __name__ == "__main__":
    main()
