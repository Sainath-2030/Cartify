# Cartify ML Service — NCF + CNN Scaffold

Standalone Python service, decoupled from `server/` and `client/`, per
CLAUDE.MD's requirement that the ML system stay modular and loosely coupled.
Nothing here is wired into the Express API yet — that's Section 10 (AI +
Cartify Integration), which is still NOT STARTED.

**Status note:** per CLAUDE.MD Section 43, the documented next steps before
Section 5/6 are the Dataset-Agnostic Refactor and Section 4 (Recommendation
Data Pipeline). This scaffold was built ahead of that order at explicit
request. It reads directly from the current `interactions` / `products`
tables as they exist today — if the Dataset-Agnostic Refactor or an H&M
import later changes those schemas, `common/db.py` is the one place to
update.

## Setup

```bash
cd ml-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in your real Postgres credentials
```

## NCF (Neural Collaborative Filtering)

Learns latent user/item embeddings from implicit feedback (interactions),
GMF + MLP fused (He et al., 2017 architecture).

```bash
python -m ncf.train
```

- Reads `interactions` (`user_id`, `product_id`, `interaction_type`, `created_at`) via `common/db.py`.
- `ncf/config.py` maps `interaction_type` → implicit-feedback weights (`purchase`: 5, `review`: 4, `rating`: 4, `cart_add`: 3, `wishlist_add`: 3, `product_click`: 2, `product_view`: 1).
- Trains with negative sampling, evaluates with leave-one-out HR@10.
- Saves `artifacts/ncf_model.pt` + `artifacts/ncf_id_maps.json` (raw DB id ↔ dense embedding index — keeps product IDs stable, per CLAUDE.MD Section 29).

### Checking the NCF Model Output & Generating Recommendations

To inspect the model status and predicted affinity score matrix for all learned user/item pairs:
```bash
python -m ncf.recommend --inspect
```

To generate the **Top-K personalized product recommendations** for a specific user:
```bash
python -m ncf.recommend --user 1 --top_k 5
python -m ncf.recommend --user 3 --top_k 5
```

## CNN (product image feature extractor)

Pretrained ResNet18 backbone (frozen) + trainable projection head, producing
a 256-dim unit-normalized embedding per product image — for content-based
similarity and cold-start recommendations.

```bash
python -m cnn.extract_features
```

- Reads `products.main_image` (a URL) via `common/db.py`, downloads/caches
  images under `data/images/`.
- Saves `artifacts/cnn_embeddings.npz` (`product_ids`, `embeddings` arrays).

## What's NOT here yet

- GRU (Section 7), Autoencoder (Section 8), Attention Fusion (Section 9) — not built.
- No FastAPI/Flask HTTP layer — these are batch/offline scripts only, not a running service yet.
- No integration with the Node/Express API (Section 10).
- Minimal real data volume from the current seed dataset may make training numbers unstable — this is expected until Section 4 (Recommendation Data Pipeline) and real usage/H&M data exist.

## Directory layout

```
ml-service/
├── common/db.py          # read-only Postgres access
├── ncf/                  # Neural Collaborative Filtering
│   ├── config.py
│   ├── dataset.py
│   ├── model.py
│   └── train.py
├── cnn/                  # product image feature extractor
│   ├── config.py
│   ├── dataset.py
│   ├── model.py
│   └── extract_features.py
├── data/images/           # local image cache (gitignored)
├── artifacts/              # saved checkpoints/embeddings (gitignored)
├── requirements.txt
└── .env.example
```
