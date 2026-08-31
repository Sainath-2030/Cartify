"""
Runs ProductCNN over every active product's main_image and saves a
(product_id -> embedding) table to ml-service/artifacts/cnn_embeddings.npz.

Run from ml-service/:
    python -m cnn.extract_features

Note: with FREEZE_BACKBONE=True (the default), this is feature extraction
only, not training — there's no label to train against yet. A trainable
variant (e.g. fine-tuned against category classification, or against the
CNN branch of the eventual fused model) is future work once Section 9
(Attention Fusion) defines what signal should drive it.
"""
import os
import numpy as np
import torch
from torch.utils.data import DataLoader
from tqdm import tqdm

from common.db import load_products
from cnn.config import BATCH_SIZE
from cnn.dataset import ProductImageDataset
from cnn.model import ProductCNN

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")


def main():
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print("Loading products from Postgres...")
    products = load_products()
    if products.empty:
        raise SystemExit("No active products found — nothing to extract features for.")

    dataset = ProductImageDataset(products)
    loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=False)

    model = ProductCNN().to(device)
    model.eval()

    all_ids = []
    all_embeddings = []
    with torch.no_grad():
        for product_ids, images in tqdm(loader, desc="Extracting CNN features"):
            images = images.to(device)
            embeddings = model(images).cpu().numpy()
            all_ids.extend(product_ids.tolist() if torch.is_tensor(product_ids) else list(product_ids))
            all_embeddings.append(embeddings)

    embeddings_matrix = np.concatenate(all_embeddings, axis=0)
    out_path = os.path.join(ARTIFACTS_DIR, "cnn_embeddings.npz")
    np.savez(out_path, product_ids=np.array(all_ids), embeddings=embeddings_matrix)
    print(f"Saved {len(all_ids)} product embeddings to {out_path}")


if __name__ == "__main__":
    main()
