"""
Extracts 256-dim CNN embeddings for all cached product images.
Run download_images.py first to populate data/image_manifest.csv.

Outputs:
  ml-service/artifacts/cnn_embeddings.npy   (N x 256 float32)
  ml-service/artifacts/cnn_id_map.json      ({"index_to_product_id": [...]})
"""
import os
import csv
import json
import numpy as np
import torch
from PIL import Image

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

try:
    from cnn.model import ImageEmbeddingNet, get_transform
except ImportError:
    from model import ImageEmbeddingNet, get_transform

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "image_manifest.csv")
EMBEDDINGS_PATH = os.path.join(ARTIFACTS_DIR, "cnn_embeddings.npy")
ID_MAP_PATH = os.path.join(ARTIFACTS_DIR, "cnn_id_map.json")

BATCH_SIZE = 32


def load_manifest():
    rows = []
    with open(MANIFEST_PATH, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def batched(iterable, n):
    for i in range(0, len(iterable), n):
        yield iterable[i:i + n]


def extract_embeddings():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = ImageEmbeddingNet(freeze_backbone=True).to(device)
    model.eval()
    transform = get_transform()

    manifest = load_manifest()
    print(f"Extracting embeddings for {len(manifest)} products on {device}...")

    all_embeddings = []
    index_to_product_id = []

    for batch in batched(manifest, BATCH_SIZE):
        tensors = []
        valid_ids = []
        for row in batch:
            try:
                img = Image.open(row["image_path"]).convert("RGB")
                tensors.append(transform(img))
                valid_ids.append(row["product_id"])
            except Exception as e:
                print(f"  Skipping product {row['product_id']}: {e}")

        if not tensors:
            continue

        batch_tensor = torch.stack(tensors).to(device)
        with torch.no_grad():
            embeddings = model(batch_tensor).cpu().numpy()

        all_embeddings.append(embeddings)
        index_to_product_id.extend(valid_ids)

    embeddings_matrix = np.concatenate(all_embeddings, axis=0).astype(np.float32)
    np.save(EMBEDDINGS_PATH, embeddings_matrix)

    with open(ID_MAP_PATH, "w") as f:
        json.dump({"index_to_product_id": index_to_product_id}, f)

    print(f"Saved {embeddings_matrix.shape} embeddings to {EMBEDDINGS_PATH}")
    print(f"Saved id map to {ID_MAP_PATH}")


if __name__ == "__main__":
    extract_embeddings()
