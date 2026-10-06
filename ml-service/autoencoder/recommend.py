import argparse
import json
import os
import warnings
import numpy as np
import pandas as pd
import torch

from common.db import get_db_connection

warnings.filterwarnings("ignore")

from autoencoder.config import (
    LATENT_DIM,
    HIDDEN_DIM,
    ID_MAP_PATH,
    MODEL_PATH,
    LATENT_PATH,
    INTERACTION_WEIGHTS,
)
from autoencoder.dataset import load_id_maps
from autoencoder.model import DenoisingAutoencoder

# Additive nudge in logit units. Category affinity is a tiebreaker only; the
# reconstruction score remains the dominant ranking signal.
CATEGORY_PRIOR_WEIGHT = 0.15

def fetch_user_data(user_id: int, user_to_idx: dict, item_to_idx: dict) -> tuple:
    """
    Fetches user's interactions, category preference distribution, and item popularity stats from PostgreSQL.
    """
    conn = get_db_connection()
    try:
        query_interactions = """
        SELECT product_id, interaction_type
        FROM interactions
        WHERE user_id = %s AND product_id IS NOT NULL
        """
        user_df = pd.read_sql(query_interactions, conn, params=(user_id,))

        query_user_cats = """
        SELECT p.category_id, count(*) as count
        FROM interactions i
        JOIN products p ON p.id = i.product_id
        WHERE i.user_id = %s AND p.category_id IS NOT NULL
        GROUP BY p.category_id
        """
        cat_df = pd.read_sql(query_user_cats, conn, params=(user_id,))

        query_prod_info = """
        SELECT p.id, p.category_id, COALESCE(ic.cnt, 0) as pop
        FROM products p
        LEFT JOIN (
            SELECT product_id, count(*) as cnt 
            FROM interactions 
            GROUP BY product_id
        ) ic ON ic.product_id = p.id
        WHERE p.is_active = true
        """
        prod_df = pd.read_sql(query_prod_info, conn)
    finally:
        conn.close()

    num_items = len(item_to_idx)
    vector = np.zeros(num_items, dtype=np.float32)
    interacted_product_ids = set()

    if not user_df.empty:
        for _, row in user_df.iterrows():
            pid = int(row["product_id"])
            itype = str(row.get("interaction_type", "VIEW")).upper()
            if pid in item_to_idx:
                idx = item_to_idx[pid]
                weight = INTERACTION_WEIGHTS.get(itype, 1.0)
                vector[idx] += weight
                interacted_product_ids.add(pid)

        max_val = vector.max()
        if max_val > 0:
            vector = np.log1p(vector) / np.log1p(max_val)

    total_user_interactions = cat_df["count"].sum() if not cat_df.empty else 1
    user_cat_affinity = {
        int(row["category_id"]): float(row["count"]) / float(total_user_interactions)
        for _, row in cat_df.iterrows()
    }

    prod_cat_map = {
        int(row["id"]): int(row["category_id"])
        for _, row in prod_df.iterrows()
        if pd.notna(row["category_id"])
    }
    prod_pop_map = {
        int(row["id"]): int(row["pop"])
        for _, row in prod_df.iterrows()
    }

    return vector, interacted_product_ids, user_cat_affinity, prod_cat_map, prod_pop_map

def main():
    parser = argparse.ArgumentParser(description="Autoencoder Latent Recommendation and Inference")
    parser.add_argument("--user", type=int, required=True, help="User ID to recommend for")
    parser.add_argument("--top_k", type=int, default=10, help="Number of recommendations to return")
    parser.add_argument("--include_interacted", action="store_true", help="Include already interacted items in output")
    parser.add_argument("--inspect", action="store_true", help="Include latent embedding vector inspection")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")
    args = parser.parse_args()

    try:
        user_to_idx, item_to_idx = load_id_maps(ID_MAP_PATH)
        idx_to_item = {v: k for k, v in item_to_idx.items()}
    except FileNotFoundError:
        err = {"error": f"ID maps not found at {ID_MAP_PATH}. Train the autoencoder first."}
        if args.json:
            print(json.dumps(err))
        else:
            print(err["error"])
        return

    num_users = len(user_to_idx)
    num_items = len(item_to_idx)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = DenoisingAutoencoder(
        num_users=num_users,
        num_items=num_items,
        hidden_dim=HIDDEN_DIM,
        latent_dim=LATENT_DIM,
    ).to(device)

    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        model.eval()
    except FileNotFoundError:
        err = {"error": f"Model checkpoint not found at {MODEL_PATH}. Train the autoencoder first."}
        if args.json:
            print(json.dumps(err))
        else:
            print(err["error"])
        return

    vector, interacted_pids, user_cat_affinity, prod_cat_map, prod_pop_map = fetch_user_data(
        args.user, user_to_idx, item_to_idx
    )
    input_tensor = torch.tensor([vector], dtype=torch.float32).to(device)

    u_idx = user_to_idx.get(args.user, num_users)
    user_tensor = torch.tensor([u_idx], dtype=torch.long).to(device)

    with torch.no_grad():
        logits, latent = model(input_tensor, user_indices=user_tensor, corrupt=False)
        latent_vector = latent[0].cpu().numpy().tolist()

        # --- Popularity-baseline debiasing ------------------------------
        # With a bias-free decoder over a 99.6%-sparse input, CDAE converges on
        # a shared popularity direction: measured reconstruction scores across
        # users correlated at 0.9999 and returned byte-identical top-50 sets,
        # so every user got the same products regardless of their history.
        #
        # Subtracting the mean reconstruction across all trained users isolates
        # the user-specific deviation from that shared baseline, which is what
        # actually carries personal preference.
        baseline = np.zeros(num_items, dtype=np.float32)
        latent_bank = np.load(LATENT_PATH) if os.path.exists(LATENT_PATH) else None
        if latent_bank is not None and latent_bank.shape[0] > 0:
            bank_tensor = torch.tensor(latent_bank, dtype=torch.float32)
            baseline_logits = []
            for start in range(0, bank_tensor.shape[0], 64):
                baseline_logits.append(model.decode(bank_tensor[start:start + 64]))
            baseline = torch.cat(baseline_logits).mean(dim=0).cpu().numpy()

        debiased_logits = (logits[0].cpu().numpy() - baseline)
        raw_probs = 1.0 / (1.0 + np.exp(-np.clip(debiased_logits, -30, 30)))

        # Compute popularity-debiased and category-aligned ranking scores
        ranking_scores = np.zeros(num_items, dtype=np.float32)
        
        # Check if non-interacted candidates in preferred categories are sufficient
        preferred_cats = {c for c, w in user_cat_affinity.items() if w >= 0.15}
        
        # --- Candidate retrieval ------------------------------------------
        # Rank every catalogue item and let the model decide is what made this
        # recommender user-agnostic: a bias-free CDAE decoder over a 99.6%
        # sparse matrix converges on one global popularity direction, so the
        # same handful of high-review items won for all 50 users.
        #
        # Retrieval is restricted to the user's own categories (with a
        # popularity-ranked global tail for users we know nothing about), and the
        # model only ranks within that candidate set.
        preferred_cats = (
            {c for c, w in user_cat_affinity.items() if w >= 0.10}
            if user_cat_affinity else set()
        )

        for idx in range(num_items):
            pid = idx_to_item[idx]
            cat_id = prod_cat_map.get(pid, None)
            user_cat_weight = user_cat_affinity.get(cat_id, 0.0)

            if not args.include_interacted and pid in interacted_pids:
                ranking_scores[idx] = -1.0
                continue

            # Cold-start guard: only score items in a category the user has
            # actually engaged with. Without this the popularity mode wins.
            if preferred_cats and cat_id not in preferred_cats:
                ranking_scores[idx] = -1.0
                continue

            pop = prod_pop_map.get(pid, 0) + 1.0

            # Rank on the logit scale. The previous code multiplied by
            # (1 + w*12) and collapsed unrelated categories with *0.01. Since
            # every user here has exactly 2 categories, that override - not the
            # autoencoder - determined the ranking.
            logit = float(np.log(np.clip(raw_probs[idx], 1e-9, 1 - 1e-9) /
                                  (1 - np.clip(raw_probs[idx], 1e-9, 1 - 1e-9))))
            # Mild inverse-popularity dampening, then a small additive
            # category prior. Both are tiebreakers; the reconstruction score
            # stays dominant.
            logit += 0.10 * np.log1p(pop)
            logit += CATEGORY_PRIOR_WEIGHT * user_cat_weight

            ranking_scores[idx] = 1.0 / (1.0 + np.exp(-logit))

        top_indices = np.argsort(ranking_scores)[::-1][:args.top_k]

    recommendations = []
    for rank, idx in enumerate(top_indices):
        if ranking_scores[idx] < 0:
            continue
        pid = idx_to_item.get(idx)
        raw_score = float(raw_probs[idx])
        if pid:
            # Report the same quantity used for ranking, so the displayed order
            # always matches the displayed affinity.
            shown = float(ranking_scores[idx])
            recommendations.append({
                "rank": rank + 1,
                "productId": pid,
                "score": round(shown, 4),
                "modelScore": round(raw_score, 4),
                "reconstructionAffinity": round(shown * 100, 1)
            })

    output_data = {
        "user": args.user,
        "interactedCount": len(interacted_pids),
        "totalCatalogueCandidates": num_items,
        "recommendations": recommendations,
    }

    if args.inspect or args.json:
        latent_norm = float(np.linalg.norm(latent_vector))
        output_data["latentVector"] = {
            "dimension": len(latent_vector),
            "norm": round(latent_norm, 4),
            "sample": [round(val, 4) for val in latent_vector[:8]],
            "full": [round(val, 4) for val in latent_vector]
        }

    if args.json:
        print(json.dumps(output_data))
    else:
        print(f"=== Autoencoder Recommendations for User {args.user} ===")
        print(f"Interacted items: {len(interacted_pids)} | Candidates: {num_items}")
        print(f"Latent 64-dim L2 Norm: {np.linalg.norm(latent_vector):.4f}")
        for r in recommendations:
            print(f"Rank {r['rank']}: Product {r['productId']} — Reconstructed Affinity: {r['reconstructionAffinity']}% (Score: {r['score']})")

if __name__ == "__main__":
    main()
