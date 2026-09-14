import argparse
import json
import os
import sys
import warnings
import numpy as np
import pandas as pd
import torch

from common.db import get_db_connection

warnings.filterwarnings("ignore")

from fusion.config import (
    FUSION_MODEL_PATH,
    FUSION_METADATA_PATH,
    MODALITIES,
    MODALITY_DESCRIPTIONS,
)
from fusion.dataset import MultiModalFeatureExtractor
from fusion.model import AttentionFusion


def fetch_user_context(user_id: int):
    """
    Fetches user's past interacted products, recent session sequence, category affinity distribution,
    and product catalog metadata.
    """
    conn = get_db_connection()
    try:
        query = """
        SELECT product_id, session_id, interaction_type, created_at
        FROM interactions
        WHERE user_id = %s AND product_id IS NOT NULL
        ORDER BY created_at ASC;
        """
        df = pd.read_sql(query, conn, params=(user_id,))

        query_user_cats = """
        SELECT p.category_id, count(*) as count
        FROM interactions i
        JOIN products p ON p.id = i.product_id
        WHERE i.user_id = %s AND p.category_id IS NOT NULL
        GROUP BY p.category_id;
        """
        cat_df = pd.read_sql(query_user_cats, conn, params=(user_id,))

        cand_query = """
        SELECT p.id, p.category_id, c.name as category_name, COALESCE(ic.cnt, 0) as pop
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN (
            SELECT product_id, count(*) as cnt
            FROM interactions
            GROUP BY product_id
        ) ic ON ic.product_id = p.id
        WHERE p.is_active = true
        ORDER BY p.id ASC;
        """
        cand_df = pd.read_sql(cand_query, conn)
    finally:
        conn.close()

    interacted_pids = set()
    session_sequence = []

    if not df.empty:
        interacted_pids = set(df["product_id"].astype(int).tolist())
        session_sequence = df["product_id"].astype(int).tolist()[-10:]

    total_user_interactions = cat_df["count"].sum() if not cat_df.empty else 1
    user_cat_affinity = {
        int(row["category_id"]): float(row["count"]) / float(total_user_interactions)
        for _, row in cat_df.iterrows()
    }

    candidate_pids = cand_df["id"].astype(int).tolist()
    prod_cat_map = {
        int(row["id"]): int(row["category_id"])
        for _, row in cand_df.iterrows()
        if pd.notna(row["category_id"])
    }
    prod_pop_map = {
        int(row["id"]): int(row["pop"])
        for _, row in cand_df.iterrows()
    }

    return (
        interacted_pids,
        session_sequence,
        candidate_pids,
        user_cat_affinity,
        prod_cat_map,
        prod_pop_map,
    )


def recommend(user_id: int, top_k: int = 10, include_interacted: bool = False, inspect: bool = False):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if not os.path.exists(FUSION_MODEL_PATH):
        return {
            "error": f"Fusion model checkpoint not found at {FUSION_MODEL_PATH}. Train the Attention Fusion layer first."
        }

    extractor = MultiModalFeatureExtractor(device=str(device))
    model = AttentionFusion().to(device)
    model.load_state_dict(torch.load(FUSION_MODEL_PATH, map_location=device))
    model.eval()

    (
        interacted_pids,
        session_sequence,
        candidate_pids,
        user_cat_affinity,
        prod_cat_map,
        prod_pop_map,
    ) = fetch_user_context(user_id)

    # Prioritize learned catalog items with collaborative/sequential embeddings
    learned_pids = set(extractor.ncf_item_to_idx.keys())
    if learned_pids:
        active_candidates = [pid for pid in candidate_pids if pid in learned_pids]
    else:
        active_candidates = candidate_pids

    # Filter out already interacted products if requested
    if not include_interacted and interacted_pids:
        eval_candidates = [pid for pid in active_candidates if pid not in interacted_pids]
        if len(eval_candidates) < top_k:
            eval_candidates = active_candidates
    else:
        eval_candidates = active_candidates

    if not eval_candidates:
        return {"error": "No candidates available for recommendation."}

    # Batch compute multi-modal features
    ncf_list, cnn_list, gru_list, ae_list = [], [], [], []
    for pid in eval_candidates:
        ncf_list.append(extractor.get_ncf_feature(user_id, pid))
        cnn_list.append(extractor.get_cnn_feature(pid))
        gru_list.append(extractor.get_gru_feature(user_id, session_sequence, pid))
        ae_list.append(extractor.get_autoencoder_feature(user_id, pid))

    batch_ncf = torch.tensor(np.array(ncf_list), dtype=torch.float32).to(device)
    batch_cnn = torch.tensor(np.array(cnn_list), dtype=torch.float32).to(device)
    batch_gru = torch.tensor(np.array(gru_list), dtype=torch.float32).to(device)
    batch_ae  = torch.tensor(np.array(ae_list), dtype=torch.float32).to(device)

    # Inference in chunks
    chunk_size = 512
    all_scores = []
    all_weights = []

    with torch.no_grad():
        for start_idx in range(0, len(eval_candidates), chunk_size):
            end_idx = start_idx + chunk_size
            sc, aw = model(
                batch_ncf[start_idx:end_idx],
                batch_cnn[start_idx:end_idx],
                batch_gru[start_idx:end_idx],
                batch_ae[start_idx:end_idx],
            )
            all_scores.append(sc.cpu().numpy())
            all_weights.append(aw.cpu().numpy())

    scores = np.concatenate(all_scores, axis=0)
    weights = np.concatenate(all_weights, axis=0)

    # Domain affinity multiplier & singleton de-biasing
    ranking_scores = np.zeros(len(eval_candidates), dtype=np.float32)
    has_cat_affinity = bool(user_cat_affinity)

    for idx, pid in enumerate(eval_candidates):
        raw_sc = scores[idx]
        cat_id = prod_cat_map.get(pid)
        aff = user_cat_affinity.get(cat_id, 0.0) if has_cat_affinity else 0.0
        pop = prod_pop_map.get(pid, 0)

        # Multiplier prioritizing items aligned with the user's historical category manifold
        if has_cat_affinity:
            cat_mult = (1.0 + aff * 6.0) if aff > 0 else 0.15
        else:
            cat_mult = 1.0

        # Singleton noise dampening: unregularized 1-interaction items are dampened
        pop_disc = 0.25 if pop <= 1 else min(1.3, 1.0 + np.log1p(pop) * 0.15)
        ranking_scores[idx] = raw_sc * cat_mult * pop_disc

    # Top K sorting based on fused, category-aligned scores
    top_indices = np.argsort(ranking_scores)[::-1][:top_k]

    recommendations = []
    top_weights = []
    modality_labels = ["NCF", "CNN", "GRU", "AUTOENCODER"]

    max_rank_score = ranking_scores[top_indices[0]] if len(top_indices) > 0 and ranking_scores[top_indices[0]] > 0 else 1.0

    for rank, idx in enumerate(top_indices):
        pid = eval_candidates[idx]
        item_w = weights[idx]
        top_weights.append(item_w)

        dom_idx = int(np.argmax(item_w))
        dom_modality = modality_labels[dom_idx]

        # Calibrate affinity percentage smoothly relative to top candidate ranking strength
        relative_ratio = float(ranking_scores[idx] / max_rank_score)
        rank_decay = (rank) * 0.025
        calibrated_score = float(np.clip(0.96 * (relative_ratio ** 0.35) - rank_decay, 0.45, 0.98))
        affinity_pct = round(calibrated_score * 100, 1)

        rec = {
            "rank": rank + 1,
            "productId": pid,
            "score": round(calibrated_score, 4),
            "affinityPercentage": affinity_pct,
            "dominantModality": dom_modality,
            "attentionWeights": {
                "ncf": round(float(item_w[0]), 3),
                "cnn": round(float(item_w[1]), 3),
                "gru": round(float(item_w[2]), 3),
                "autoencoder": round(float(item_w[3]), 3),
            }
        }
        recommendations.append(rec)

    mean_weights = np.mean(top_weights, axis=0) if top_weights else np.array([0.25, 0.25, 0.25, 0.25])
    aggregate_attention = {
        "NCF": round(float(mean_weights[0]), 4),
        "CNN": round(float(mean_weights[1]), 4),
        "GRU": round(float(mean_weights[2]), 4),
        "AUTOENCODER": round(float(mean_weights[3]), 4),
    }

    # Generate explanation
    highest_mod = modality_labels[int(np.argmax(mean_weights))]
    highest_pct = round(float(np.max(mean_weights)) * 100, 1)
    explanation = f"Recommendations dynamically prioritized by {highest_mod} ({highest_pct}% weight) aligned with user interaction profile and session state."

    output = {
        "user": user_id,
        "interactedCount": len(interacted_pids),
        "sessionLength": len(session_sequence),
        "totalCatalogueCandidates": len(eval_candidates),
        "aggregateAttentionWeights": aggregate_attention,
        "explanation": explanation,
        "recommendations": recommendations,
    }

    if inspect and os.path.exists(FUSION_METADATA_PATH):
        with open(FUSION_METADATA_PATH, "r", encoding="utf-8") as f:
            output["modelMetadata"] = json.load(f)

    return output


def main():
    parser = argparse.ArgumentParser(description="Cartify Multi-Modal Attention Fusion Inference")
    parser.add_argument("--user", type=int, required=True, help="User ID to recommend for")
    parser.add_argument("--top_k", type=int, default=10, help="Number of recommendations")
    parser.add_argument("--include_interacted", action="store_true", help="Include already interacted items")
    parser.add_argument("--json", action="store_true", help="Output JSON format")
    parser.add_argument("--inspect", action="store_true", help="Include model metadata and inspection details")

    args = parser.parse_args()
    res = recommend(
        user_id=args.user,
        top_k=args.top_k,
        include_interacted=args.include_interacted,
        inspect=args.inspect,
    )

    if args.json:
        print(json.dumps(res))
    else:
        if "error" in res:
            print(f"Error: {res['error']}")
            return

        print(f"=== Multi-Modal Attention Fusion Recommendations for User #{args.user} ===")
        print(f"Candidates: {res['totalCatalogueCandidates']} | History: {res['interactedCount']} items")
        print(f"Aggregate Attention: {res['aggregateAttentionWeights']}")
        print(f"Reasoning: {res['explanation']}\n")

        for r in res["recommendations"]:
            print(
                f"Rank #{r['rank']} | Product #{r['productId']} | Fused Score: {r['score']} ({r['affinityPercentage']}%) "
                f"| Dominant: {r['dominantModality']} "
                f"(NCF: {r['attentionWeights']['ncf']:.2f}, CNN: {r['attentionWeights']['cnn']:.2f}, "
                f"GRU: {r['attentionWeights']['gru']:.2f}, AE: {r['attentionWeights']['autoencoder']:.2f})"
            )


if __name__ == "__main__":
    main()
