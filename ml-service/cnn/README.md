# Cartify — Section 6: CNN Image Feature Extractor

Implements the CNN branch of Cartify's planned hybrid recommendation
architecture (NCF + CNN + GRU + Autoencoder → Attention Fusion).
This module extracts 256-dimensional image embeddings for every product
using a pretrained ResNet18 backbone, for content-based similarity and
cold-start discovery.

## ⚠️ Before you copy these files in

I don't have access to your actual Cartify codebase or database schema
(only your `CLAUDE.md`), so this module assumes:

- Your `products` table has columns `id` and `image_url` (per Section 13
  of CLAUDE.md — the Amazon dataset import includes verified image URLs).
- Your `ml-service/` already has a `venv/` and `requirements.txt` from the
  NCF phase (Section 5), including `torch` and `torchvision`.
- `ml-service/artifacts/` already exists (it should, from `ncf_model.pt`).

If your schema or folder names differ, adjust the constants at the top of
`cnn/download_images.py` and `cnn/extract.py` accordingly.

## Where these files go

Drop the `cnn/` folder into your existing `ml-service/` directory:

```
ml-service/
├── venv/
├── artifacts/
│   ├── ncf_model.pt
│   ├── ncf_id_maps.json
│   ├── cnn_embeddings.npy      ← new, created by extract.py
│   └── cnn_id_map.json         ← new, created by extract.py
├── cnn/                        ← new, this folder
│   ├── __init__.py
│   ├── model.py
│   ├── download_images.py
│   ├── extract.py
│   └── similarity.py
├── ncf/
└── requirements.txt
```

## Setup

Add these to `ml-service/requirements.txt` if not already present:

```
Pillow
requests
python-dotenv
psycopg2-binary
```

Then, from `ml-service/`:

```bash
source venv/bin/activate
pip install -r requirements.txt
```

Make sure your `.env` (or existing DB env vars) includes:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=<your_db_name>
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
```

## Usage

```bash
cd ml-service
source venv/bin/activate

# 1. Cache product images locally from image_url
python cnn/download_images.py

# 2. Extract 256-dim embeddings for all cached images
python cnn/extract.py

# 3. Sanity-check: find visually similar products
python cnn/similarity.py <some_product_id>
```

## What each file does

| File | Purpose |
|---|---|
| `model.py` | `ImageEmbeddingNet` — frozen ResNet18 backbone + trainable projection head producing 256-dim embeddings |
| `download_images.py` | Pulls `(id, image_url)` from PostgreSQL, downloads and caches images to `data/images/`, writes `data/image_manifest.csv` |
| `extract.py` | Batches cached images through the model, saves `artifacts/cnn_embeddings.npy` + `artifacts/cnn_id_map.json` |
| `similarity.py` | Cosine-similarity top-K lookup against the saved embeddings — the basis for "visually similar products" |

## Testing checklist

- [ ] `download_images.py` runs without error; `data/image_manifest.csv` created with expected row count
- [ ] Failed-download count is low/explainable (dead URLs, etc.)
- [ ] `extract.py` produces `artifacts/cnn_embeddings.npy` with shape `(N, 256)` matching manifest row count
- [ ] `cnn_id_map.json` length matches embedding matrix row count
- [ ] Spot-check `similarity.py` on a few known products — results should look visually/categorically plausible
- [ ] No existing NCF artifacts or endpoints touched/broken

## Git commit message

```
feat(section-6): implement CNN image feature extractor (ResNet18 backbone, 256-dim embeddings)
```

## Not yet decided (tell Claude next session)

- Whether to expose this via a new `/admin/models` panel entry (like the
  NCF simulator) or keep it as an internal ML artifact for now.
- Whether GRU (Section 25) or Autoencoder (Section 27) is next, per the
  roadmap in Section 43 of `CLAUDE.md`.

Remember to update `CLAUDE.md` (Section 43 / 26) once this is verified —
per the project's own CLAUDE.md Update Rule (Section 40): change
Section 26 from PLANNED to IMPLEMENTED only after real testing passes.
