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
    model, user_to_idx, item_to_idx, idx_to_item = load_ncf_model()
    results = []
    with torch.no_grad():
        for user_id, u_idx in user_to_idx.items():
            for item_id, i_idx in item_to_idx.items():
                u_t = torch.tensor([u_idx], dtype=torch.long)
                i_t = torch.tensor([i_idx], dtype=torch.long)
                score = model(u_t, i_t).item()
                results.append({
                    "user_id": user_id,
                    "product_id": item_id,
                    "predicted_score": round(score, 4)
                })

    if as_json:
        status_info = get_model_status()
        output_data = {
            "status": status_info,
            "matrix": results
        }
        print(json.dumps(output_data))
        return

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

    # Rank products
    ranked_indices = scores.argsort()[::-1][:top_k]
    
    recommendations = []
    for rank, idx in enumerate(ranked_indices, start=1):
        raw_product_id = idx_to_item[idx]
        score = float(scores[idx])
        p_info = product_lookup.get(raw_product_id, {})
        price_val = float(p_info["price"]) if p_info.get("price") is not None else None
        final_price_val = float(p_info["final_price"]) if p_info.get("final_price") is not None else None
        rating_val = float(p_info["rating"]) if p_info.get("rating") is not None else 0.0

        recommendations.append({
            "rank": rank,
            "productId": int(raw_product_id),
            "score": round(score, 4),
            "affinityPercentage": round(score * 100, 1),
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
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    args = parser.parse_args()

    if args.inspect:
        inspect_model_output(as_json=args.json)
    else:
        recommend_for_user(user_id=args.user, top_k=args.top_k, as_json=args.json)


if __name__ == "__main__":
    main()
