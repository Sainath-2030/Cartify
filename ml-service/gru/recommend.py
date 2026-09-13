import argparse
import json
import torch
import warnings
import pandas as pd
from common.db import get_db_connection

# Suppress warnings from pandas/db connection
warnings.filterwarnings("ignore")

from gru.config import (
    MAX_SEQUENCE_LENGTH,
    EMBEDDING_DIM,
    HIDDEN_DIM,
    NUM_LAYERS,
    ID_MAP_PATH,
    MODEL_PATH,
)
from gru.dataset import load_id_maps
from gru.model import GRURecommender

def fetch_user_recent_sequence_with_context(user_id, item_to_idx):
    conn = get_db_connection()
    try:
        # 1. Fetch user's latest active session with product category
        query = """
        WITH latest_session AS (
            SELECT session_id
            FROM interactions
            WHERE user_id = %s AND session_id IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 1
        )
        SELECT i.product_id, c.name as category
        FROM interactions i
        JOIN products p ON i.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        WHERE i.user_id = %s AND i.session_id = (SELECT session_id FROM latest_session)
        ORDER BY i.created_at ASC
        """
        df = pd.read_sql(query, conn, params=(user_id, user_id))
        
        # 2. Fallback to recent interactions if latest session had < 2 items
        if df.empty or len(df) < 2:
            query_fallback = """
            SELECT i.product_id, c.name as category
            FROM interactions i
            JOIN products p ON i.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            WHERE i.user_id = %s AND i.product_id IS NOT NULL
            ORDER BY i.created_at DESC
            LIMIT %s
            """
            df_fallback = pd.read_sql(query_fallback, conn, params=(user_id, MAX_SEQUENCE_LENGTH * 2))
            if not df_fallback.empty:
                df = df_fallback.iloc[::-1] # Reverse to chronological order
    finally:
        conn.close()
    
    if df.empty:
        return {"sequence": [], "dominant_category": None, "session_categories": set()}
        
    sequence = df["product_id"].tolist()
    idx_sequence = [item_to_idx.get(pid) for pid in sequence if pid in item_to_idx]
    valid_idx_seq = [idx for idx in idx_sequence if idx is not None]
    
    categories = df["category"].dropna().tolist()
    dominant_category = pd.Series(categories).mode()[0] if categories else None
    session_categories = set(categories)
    
    return {
        "sequence": valid_idx_seq,
        "dominant_category": dominant_category,
        "session_categories": session_categories,
    }

def load_catalog_metadata():
    conn = get_db_connection()
    try:
        query_cat = "SELECT p.id, c.name as category FROM products p JOIN categories c ON p.category_id = c.id"
        df_cat = pd.read_sql(query_cat, conn)
        cat_map = dict(zip(df_cat["id"], df_cat["category"]))
        
        query_pop = "SELECT product_id, COUNT(*) as cnt FROM interactions GROUP BY product_id"
        df_pop = pd.read_sql(query_pop, conn)
        pop_map = dict(zip(df_pop["product_id"], df_pop["cnt"]))
    finally:
        conn.close()
    return cat_map, pop_map


def main():
    parser = argparse.ArgumentParser(description="GRU Session Sequence Inference")
    parser.add_argument("--user", type=int, required=True, help="User ID to recommend for")
    parser.add_argument("--top_k", type=int, default=10, help="Number of recommendations")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()
    
    try:
        user_to_idx, item_to_idx = load_id_maps(ID_MAP_PATH)
        idx_to_item = {v: k for k, v in item_to_idx.items()}
    except FileNotFoundError:
        if args.json:
            print(json.dumps({"error": "ID maps not found. Train the model first."}))
        else:
            print("Error: ID maps not found.")
        return
        
    num_items = len(item_to_idx)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    model = GRURecommender(
        num_items=num_items,
        embedding_dim=EMBEDDING_DIM,
        hidden_dim=HIDDEN_DIM,
        num_layers=NUM_LAYERS
    ).to(device)
    
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        model.eval()
    except FileNotFoundError:
        if args.json:
            print(json.dumps({"error": "Model checkpoint not found. Train the model first."}))
        else:
            print("Error: Model checkpoint not found.")
        return

    # Fetch active sequence and session context
    sequence_data = fetch_user_recent_sequence_with_context(args.user, item_to_idx)
    sequence = sequence_data["sequence"]
    dominant_cat = sequence_data.get("dominant_category")
    session_cats = sequence_data.get("session_categories", set())
    
    if not sequence:
        if args.json:
            print(json.dumps({
                "user": args.user,
                "recommendations": [],
                "error": "No recent session interactions found for this user."
            }))
        else:
            print("No interactions found.")
        return

    # Take the most recent items up to max length
    if len(sequence) > MAX_SEQUENCE_LENGTH:
        sequence = sequence[-MAX_SEQUENCE_LENGTH:]
        
    seq_length = len(sequence)
    pad_len = MAX_SEQUENCE_LENGTH - seq_length
    padded_seq = [0] * pad_len + sequence
    
    seq_tensor = torch.tensor([padded_seq], dtype=torch.long).to(device)
    len_tensor = torch.tensor([seq_length], dtype=torch.long)
    
    # Load catalog categories and popularity for session context continuity
    cat_map, pop_map = load_catalog_metadata()
    
    with torch.no_grad():
        logits = model(seq_tensor, len_tensor)
        # Prevent recommending padding token (index 0)
        logits[0, 0] = -float('inf')
        
        # Mask out items already in the user's active sequence
        for past_idx in sequence:
            logits[0, past_idx] = -float('inf')
            
        # Apply session category continuity & de-bias unregularized singleton items
        for idx, item_id in idx_to_item.items():
            if idx == 0:
                continue
            item_cat = cat_map.get(item_id)
            if dominant_cat and item_cat == dominant_cat:
                logits[0, idx] += 4.0
            elif item_cat in session_cats:
                logits[0, idx] += 2.0
                
            # Penalize single-interaction noise outliers that have aberrant high vector norms
            pop = pop_map.get(item_id, 0)
            if pop <= 1:
                logits[0, idx] -= 3.0
        
        probs = torch.softmax(logits[0], dim=0)
        top_probs, top_indices = torch.topk(probs, args.top_k)
        
    recommendations = []
    for rank, (prob, idx) in enumerate(zip(top_probs.tolist(), top_indices.tolist())):
        item_id = idx_to_item.get(idx)
        if item_id:
            recommendations.append({
                "rank": rank + 1,
                "productId": item_id,
                "score": float(prob)
            })
            
    if args.json:
        print(json.dumps({
            "user": args.user,
            "sequenceLength": seq_length,
            "recommendations": recommendations
        }))
    else:
        print(f"Recommendations for user {args.user}:")
        for rec in recommendations:
            print(f"Rank {rec['rank']}: Product {rec['productId']} (Score: {rec['score']:.4f})")

if __name__ == "__main__":
    main()

