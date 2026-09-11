"""
Downloads and caches product images referenced by image_url in PostgreSQL,
so extraction runs offline against local files afterward.

ASSUMPTION: products table has columns (id, image_url). Adjust the SQL
below if your actual schema differs.
"""
import os
import csv
import time
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from common.db import get_db_connection

IMAGE_CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "images")
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "image_manifest.csv")


def fetch_products_with_images(limit=1000):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, main_image AS image_url
        FROM products
        WHERE main_image IS NOT NULL AND main_image != ''
        ORDER BY rating DESC, review_count DESC
        LIMIT %s
    """, (limit,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def download_all(retry=2, timeout=10, sleep_between=0.05):
    os.makedirs(IMAGE_CACHE_DIR, exist_ok=True)
    products = fetch_products_with_images()
    print(f"Found {len(products)} products with image_url.")

    manifest_rows = []
    failed = 0

    for i, row in enumerate(products):
        product_id = row["id"]
        url = row["image_url"]
        ext = os.path.splitext(url.split("?")[0])[1] or ".jpg"
        filename = f"{product_id}{ext}"
        filepath = os.path.join(IMAGE_CACHE_DIR, filename)

        if os.path.exists(filepath):
            manifest_rows.append({"product_id": product_id, "image_path": filepath})
            continue

        success = False
        for attempt in range(retry):
            try:
                resp = requests.get(url, timeout=timeout)
                resp.raise_for_status()
                with open(filepath, "wb") as f:
                    f.write(resp.content)
                success = True
                break
            except requests.RequestException:
                time.sleep(sleep_between)

        if success:
            manifest_rows.append({"product_id": product_id, "image_path": filepath})
        else:
            failed += 1

        if (i + 1) % 500 == 0:
            print(f"  ...{i + 1}/{len(products)} processed")

    with open(MANIFEST_PATH, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["product_id", "image_path"])
        writer.writeheader()
        writer.writerows(manifest_rows)

    print(f"Done. Cached {len(manifest_rows)} images, {failed} failed downloads.")
    print(f"Manifest written to {MANIFEST_PATH}")


if __name__ == "__main__":
    download_all()
