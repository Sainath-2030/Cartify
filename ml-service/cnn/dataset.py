"""
Loads product images referenced by products.main_image (a URL) into a local
cache, then serves them as normalized tensors for the CNN feature extractor.

This is intentionally decoupled from the product catalogue's shape — it only
needs (product_id, image_url) pairs, so it works unchanged whether the
catalogue is the current seed data or a future H&M dataset import (see
CLAUDE.MD Section 30, "External Dataset Rules").
"""
import os
import hashlib
import requests
from PIL import Image
import torch
from torch.utils.data import Dataset
from torchvision import transforms

from cnn.config import IMAGE_SIZE, IMAGE_CACHE_DIR, REQUEST_TIMEOUT_SECONDS

TRANSFORM = transforms.Compose(
    [
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),  # ImageNet stats
    ]
)


def _cache_path(image_url: str) -> str:
    os.makedirs(IMAGE_CACHE_DIR, exist_ok=True)
    digest = hashlib.sha256(image_url.encode()).hexdigest()[:24]
    ext = os.path.splitext(image_url.split("?")[0])[1] or ".jpg"
    return os.path.join(IMAGE_CACHE_DIR, f"{digest}{ext}")


def ensure_downloaded(image_url: str) -> str:
    path = _cache_path(image_url)
    if os.path.exists(path):
        return path
    resp = requests.get(image_url, timeout=REQUEST_TIMEOUT_SECONDS)
    resp.raise_for_status()
    with open(path, "wb") as f:
        f.write(resp.content)
    return path


class ProductImageDataset(Dataset):
    """
    products_df must have columns: id, main_image (as returned by
    common.db.load_products()).
    """

    def __init__(self, products_df):
        self.records = products_df[["id", "main_image"]].dropna().to_dict("records")

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        record = self.records[idx]
        try:
            local_path = ensure_downloaded(record["main_image"])
            image = Image.open(local_path).convert("RGB")
            tensor = TRANSFORM(image)
        except Exception as exc:  # noqa: BLE001 — log and skip bad URLs, don't crash the batch
            print(f"[cnn] failed to load product {record['id']}: {exc}")
            tensor = torch.zeros(3, IMAGE_SIZE, IMAGE_SIZE)
        return record["id"], tensor
