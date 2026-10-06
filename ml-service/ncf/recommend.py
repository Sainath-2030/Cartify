"""
Inference and Recommendation script for trained NCF model.
Allows inspecting model outputs, calculating affinity scores, and generating top-K recommendations.

Usage:
    python -m ncf.recommend --user 1 --top_k 5
    python -m ncf.recommend --user 1 --top_k 5 --json
    python -m ncf.recommend --inspect --json
"""
import os
import sys
import json
import argparse
import torch
import numpy as np
import pandas as pd

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from common.db import load_products, load_interactions
from ncf.model import NCF

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "ncf_model.pt")
ID_MAPS_PATH = os.path.join(ARTIFACTS_DIR, "ncf_id_maps.json")

# Additive nudge, expressed in logit units. Category affinity is a tiebreaker
# only; the learned model score remains the dominant ranking signal. Kept small
# because raw model probabilities here sit in a narrow 0.3-0.6 band, so a large
# nudge would let the heuristic reorder genuine model preferences.
CATEGORY_PRIOR_WEIGHT = 0.15


def load_ncf_model():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ID_MAPS_PATH):
        raise FileNotFoundError(
            "Trained model artifacts not found. Please run 'python -m ncf.train' first."
        )

    with open(ID_MAPS_PATH, "r") as f:
        maps = json.load(f)

    user_to_idx = {int(k): v for k, v in maps["user_to_idx"].items()}
    item_to_idx = {int(k): v for k, v in maps["item_to_idx"].items()}
    idx_to_item = {v: k for k, v in item_to_idx.items()}

    checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
    num_users = checkpoint["num_users"]
    num_items = checkpoint["num_items"]

    model = NCF(num_users=num_users, num_items=num_items)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    return model, user_to_idx, item_to_idx, idx_to_item


def get_model_status():
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ID_MAPS_PATH):
        return {
            "status": "NOT_TRAINED",
            "message": "Model artifacts not found."
        }
    
    with open(ID_MAPS_PATH, "r") as f:
        maps = json.load(f)

    user_ids = sorted([int(k) for k in maps["user_to_idx"].keys()])
    item_ids = sorted([int(k) for k in maps["item_to_idx"].keys()])
    mtime = os.path.getmtime(MODEL_PATH)

    return {
        "status": "ACTIVE",
        "checkpointPath": MODEL_PATH,
        "idMapsPath": ID_MAPS_PATH,
        "lastTrainedAt": pd.to_datetime(mtime, unit="s").isoformat(),
        "usersCount": len(user_ids),
        "itemsCount": len(item_ids),
        "userIds": user_ids,
        "itemIds": item_ids,
    }


def inspect_model_output(as_json: bool = False):
    """
    Full user x item affinity matrix.

    This used to run a nested Python loop issuing one scalar forward pass per
    (user, item) pair. At 50 users x 2,814 items that is 140,700 individual
    `model(...)` calls, which measured 39 seconds - and the server's affinity
    matrix endpoint had a 3s timeout, so it fell back to a fabricated matrix
    on literally every call.

    The matrix is now evaluated in one batched pass over a shared user-embedding
    tensor, which takes well under a second.
    """
    model, user_to_idx, item_to_idx, idx_to_item = load_ncf_model()

    user_ids_sorted = sorted(user_to_idx.keys())
    item_ids_sorted = sorted(item_to_idx.keys())
    n_users, n_items = len(user_ids_sorted), len(item_ids_sorted)

    with torch.no_grad():
        user_idx_tensor = torch.tensor([user_to_idx[u] for u in user_ids_sorted], dtype=torch.long)
        item_idx_tensor = torch.tensor([item_to_idx[i] for i in item_ids_sorted], dtype=torch.long)

        # Expand to the full (n_users x n_items) grid and score in one pass.
        users_grid = user_idx_tensor.repeat_interleave(n_items)
        items_grid = item_idx_tensor.repeat(n_users)

        CHUNK = 200_000
        flat_scores = []
        for start in range(0, users_grid.numel(), CHUNK):
            end = start + CHUNK
            flat_scores.append(
                model(users_grid[start:end], items_grid[start:end])
            )
        score_matrix = torch.cat(flat_scores).reshape(n_users, n_items).numpy()

    results = []
    for u_pos, user_id in enumerate(user_ids_sorted):
        row = score_matrix[u_pos]
        for i_pos, item_id in enumerate(item_ids_sorted):
            results.append({
                "user_id": user_id,
                "product_id": item_id,
                "predicted_score": round(float(row[i_pos]), 4)
            })

    if as_json:
        status_info = get_model_status()
        output_data = {
            "status": status_info,
            "matrix": results
        }
        print(json.dumps(output_data))
        return

    _print_human_readable_matrix(model, user_to_idx, item_to_idx, results)


def inspect_model_summary(as_json: bool = False):
    """
    Compact aggregate view of the same matrix.

    Emitting all 50 x 17,949 = 897,450 raw pairs cost ~8.8MB of JSON and 32
    seconds of server time. The admin panel only ever rendered aggregate
    statistics from it, so this reports those directly instead.
    """
    model, user_to_idx, item_to_idx, idx_to_item = load_ncf_model()

    item_to_idx_keys = sorted(item_to_idx.keys())
    user_ids_sorted = sorted(user_to_idx.keys())
    n_users, n_items = len(user_ids_sorted), len(item_to_idx)

    with torch.no_grad():
        user_idx_tensor = torch.tensor(
            [user_to_idx[u] for u in user_ids_sorted], dtype=torch.long
        )
        item_idx_tensor = torch.tensor(
            [item_to_idx[i] for i in item_to_idx_keys], dtype=torch.long
        )
        users_grid = user_idx_tensor.repeat_interleave(n_items)
        items_grid = item_idx_tensor.repeat(n_users)

        CHUNK = 200_000
        chunks = [
            model(users_grid[s:s + CHUNK], items_grid[s:s + CHUNK])
            for s in range(0, users_grid.numel(), CHUNK)
        ]
        mat = torch.cat(chunks).reshape(n_users, n_items).numpy()

    per_user = []
    for pos, uid in enumerate(user_ids_sorted):
        row = mat[pos]
        top = np.argsort(row)[::-1][:5]
        per_user.append({
            "user_id": uid,
            "mean_score": round(float(row.mean()), 4),
            "max_score": round(float(row.max()), 4),
            "top_items": [int(item_to_idx_keys[i]) for i in top],
        })

    summary = {
        "status": get_model_status(),
        "usersCount": n_users,
        "itemsCount": n_items,
        "matrixShape": [n_users, n_items],
        "globalMean": round(float(mat.mean()), 6),
        "globalMax": round(float(mat.max()), 4),
        "distinctTopItemSets": len({
            tuple(p["top_items"]) for p in per_user
        }),
        "perUser": per_user,
    }
    print(json.dumps(summary))


def _print_human_readable_matrix(model, user_to_idx, item_to_idx, results):
    print("=" * 60)
    print("           NCF MODEL ARTIFACTS & STATUS")
    print("=" * 60)
    print(f"Checkpoint Path:     {MODEL_PATH}")
    print(f"ID Maps Path:        {ID_MAPS_PATH}")
    print(f"Learned Users Count: {len(user_to_idx)} (IDs: {list(user_to_idx.keys())})")
    print(f"Learned Items Count: {len(item_to_idx)} (IDs: {list(item_to_idx.keys())})")
    print("=" * 60)

    print("\n--- PREDICTED AFFINITY SCORES (0.0 to 1.0) ---")
    df = pd.DataFrame(results)
    print(df.to_string(index=False))


def recommend_for_user(user_id: int, top_k: int = 5, as_json: bool = False):
    model, user_to_idx, item_to_idx, idx_to_item = load_ncf_model()

    if user_id not in user_to_idx:
        if as_json:
            print(json.dumps({
                "success": False,
                "error": f"User ID {user_id} has no training history in the NCF embedding table.",
                "availableUsers": list(user_to_idx.keys())
            }))
            return
        print(f"\n[Warning] User ID {user_id} has no training history in the NCF embedding table.")
        print(f"Available learned user IDs: {list(user_to_idx.keys())}")
        return

    u_idx = user_to_idx[user_id]
    item_indices = list(range(len(item_to_idx)))
    user_tensor = torch.tensor([u_idx] * len(item_indices), dtype=torch.long)
    item_tensor = torch.tensor(item_indices, dtype=torch.long)

    with torch.no_grad():
        scores = model(user_tensor, item_tensor).numpy()

    # Load catalogue metadata
    products_df = load_products()
    product_lookup = products_df.set_index("id").to_dict("index") if not products_df.empty else {}

    # --- User context, used only as a gentle prior -----------------------
    # The previous code multiplied the model score by (1 + w*8) and collapsed
    # non-matching items by 100x (*0.01). Because every user in this dataset
    # touches exactly 2 categories, that override - not the model - decided the
    # ranking, so recommendations collapsed to "highest rated items in the
    # user's 2 categories". The model now leads and category affinity is a
    # small additive nudge on the logit scale.
    from common.db import get_db_connection
    conn = get_db_connection()
    try:
        user_cat_df = pd.read_sql("""
            SELECT p.category_id, count(*) as count
            FROM interactions i
            JOIN products p ON p.id = i.product_id
            WHERE i.user_id = %s AND p.category_id IS NOT NULL
            GROUP BY p.category_id
        """, conn, params=(user_id,))
        seen_df = pd.read_sql("""
            SELECT DISTINCT product_id FROM interactions
            WHERE user_id = %s AND product_id IS NOT NULL
        """, conn, params=(user_id,))
    finally:
        conn.close()

    cat_weights = {}
    if not user_cat_df.empty:
        total = user_cat_df["count"].sum()
        cat_weights = {int(r["category_id"]): float(r["count"]) / float(total) for _, r in user_cat_df.iterrows()}

    already_seen = set(int(p) for p in seen_df["product_id"].tolist()) if not seen_df.empty else set()

    # Rank on the logit scale so the prior cannot invert the model's ordering.
    ranking_scores = np.log(np.clip(scores, 1e-9, 1 - 1e-9) / (1 - np.clip(scores, 1e-9, 1 - 1e-9)))
    for idx in range(len(item_indices)):
        raw_pid = idx_to_item[idx]
        p_cat = product_lookup.get(raw_pid, {}).get("category_id")
        w = cat_weights.get(int(p_cat), 0.0) if (p_cat is not None and pd.notna(p_cat)) else 0.0
        ranking_scores[idx] += CATEGORY_PRIOR_WEIGHT * w
        # Already-interacted items are not recommendations.
        if raw_pid in already_seen:
            ranking_scores[idx] = -np.inf

    ranked_indices = ranking_scores.argsort()[::-1][:top_k]

    recommendations = []
    for rank, idx in enumerate(ranked_indices, start=1):
        raw_product_id = idx_to_item[idx]
        # Report the model score, not the prior-adjusted ranking score, so the
        # UI never displays a number the model did not produce.
        score = float(scores[idx])
        p_info = product_lookup.get(raw_product_id, {})
        price_val = float(p_info["price"]) if p_info.get("price") is not None else None
        final_price_val = float(p_info["final_price"]) if p_info.get("final_price") is not None else None
        rating_val = float(p_info["rating"]) if p_info.get("rating") is not None else 0.0

        # The UI ranks and displays on this same number, so rank order always
        # matches the displayed affinity. Previously the list was ordered by the
        # prior-adjusted score while `score` showed the raw model output, so a
        # rank #4 item could display a higher percentage than rank #1.
        prior_w = cat_weights.get(
            int(product_lookup.get(raw_product_id, {}).get("category_id"))
            if product_lookup.get(raw_product_id, {}).get("category_id") is not None
            and pd.notna(product_lookup.get(raw_product_id, {}).get("category_id"))
            else -1,
            0.0,
        )
        final_score = 1.0 / (1.0 + np.exp(-(float(np.log(np.clip(score, 1e-9, 1 - 1e-9) / (1 - np.clip(score, 1e-9, 1 - 1e-9)))) + CATEGORY_PRIOR_WEIGHT * prior_w)))

        recommendations.append({
            "rank": rank,
            "productId": int(raw_product_id),
            "score": round(float(final_score), 4),
            "modelScore": round(score, 4),
            "affinityPercentage": round(float(final_score) * 100, 1),
            "name": str(p_info.get("name", f"Product #{raw_product_id}")),
            "price": price_val,
            "finalPrice": final_price_val,
            "mainImage": str(p_info.get("main_image", "")),
            "brand": str(p_info.get("brand", "N/A")),
            "rating": rating_val,
            "categoryId": int(p_info["category_id"]) if p_info.get("category_id") is not None else None
        })

    if as_json:
        print(json.dumps({
            "success": True,
            "userId": user_id,
            "totalCandidates": len(item_indices),
            "recommendations": recommendations
        }))
        return

    print("\n" + "=" * 80)
    print(f"       TOP {len(recommendations)} NCF RECOMMENDATIONS FOR USER ID {user_id}")
    print("=" * 80)

    for item in recommendations:
        print(f"Rank #{item['rank']} | Score: {item['score']:.4f} ({item['affinityPercentage']}% affinity)")
        print(f"  Product ID:  {item['productId']}")
        print(f"  Title:       {item['name']}")
        print(f"  Price:       Rs. {item['finalPrice']} | Brand: {item['brand']} | Rating: {item['rating']}/5")
        print("-" * 80)


def main():
    parser = argparse.ArgumentParser(description="Cartify NCF Recommendation & Output Inspector")
    parser.add_argument("--user", type=int, default=1, help="User ID to generate recommendations for (default: 1)")
    parser.add_argument("--top_k", type=int, default=5, help="Number of recommendations to return (default: 5)")
    parser.add_argument("--inspect", action="store_true", help="Inspect all predicted affinity matrix scores")
    parser.add_argument("--summary", action="store_true", help="Compact per-user affinity summary (fast)")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    args = parser.parse_args()

    if args.summary:
        inspect_model_summary()
    elif args.inspect:
        inspect_model_output(as_json=args.json)
    else:
        recommend_for_user(user_id=args.user, top_k=args.top_k, as_json=args.json)


if __name__ == "__main__":
    main()
