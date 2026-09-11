"""
Content-based similarity lookup using CNN embeddings.
Useful for "visually similar products" and cold-start discovery.
"""
import os
import json
import numpy as np

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "artifacts")
EMBEDDINGS_PATH = os.path.join(ARTIFACTS_DIR, "cnn_embeddings.npy")
ID_MAP_PATH = os.path.join(ARTIFACTS_DIR, "cnn_id_map.json")


def load_index():
    embeddings = np.load(EMBEDDINGS_PATH)
    with open(ID_MAP_PATH) as f:
        id_map = json.load(f)["index_to_product_id"]
    # normalize for cosine similarity via dot product
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normalized = embeddings / np.clip(norms, 1e-8, None)
    return normalized, id_map


def top_k_similar(product_id, k: int = 10):
    product_id_str = str(product_id)
    normalized, id_map = load_index()
    id_map_str = [str(x) for x in id_map]
    if product_id_str not in id_map_str:
        raise ValueError(f"Unknown product_id: {product_id}")

    idx = id_map_str.index(product_id_str)
    query_vec = normalized[idx]
    scores = normalized @ query_vec
    ranked = np.argsort(-scores)

    results = []
    for i in ranked:
        if id_map_str[i] == product_id_str:
            continue
        results.append({
            "product_id": int(id_map[i]) if str(id_map[i]).isdigit() else id_map[i],
            "score": float(scores[i]),
            "similarity_percentage": round(float(scores[i]) * 100, 1)
        })
        if len(results) >= k:
            break
    return results


def get_matrix_sample(n: int = 6):
    normalized, id_map = load_index()
    samples = []
    for i in range(min(n, len(id_map))):
        samples.append({
            "product_id": int(id_map[i]) if str(id_map[i]).isdigit() else id_map[i],
            "vector_sample": [round(float(v), 4) for v in normalized[i][:8]],
            "norm": round(float(np.linalg.norm(normalized[i])), 4),
            "dim": int(normalized.shape[1])
        })
    return samples


import sys
import argparse

def get_cnn_status():
    if not os.path.exists(EMBEDDINGS_PATH) or not os.path.exists(ID_MAP_PATH):
        return {
            "status": "NOT_TRAINED",
            "message": "CNN embeddings artifacts not found."
        }
    try:
        embeddings = np.load(EMBEDDINGS_PATH)
        with open(ID_MAP_PATH) as f:
            id_map = json.load(f)["index_to_product_id"]
        stats = os.stat(EMBEDDINGS_PATH)
        return {
            "status": "ACTIVE",
            "total_embeddings": len(id_map),
            "embedding_dimension": int(embeddings.shape[1]),
            "last_extracted_at": stats.st_mtime,
            "sample_product_ids": [int(x) if str(x).isdigit() else x for x in id_map[:10]]
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "error": str(e)
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CNN Image Similarity and Inspection")
    parser.add_argument("--product", type=str, help="Product ID to find visual similarities for")
    parser.add_argument("--top_k", type=int, default=5, help="Number of visual neighbors to return")
    parser.add_argument("--matrix_sample", action="store_true", help="Return sample embedding vectors")
    parser.add_argument("--inspect", action="store_true", help="Inspect CNN embedding matrix and status")
    parser.add_argument("--json", action="store_true", help="Output in JSON format")

    args = parser.parse_args()

    if args.matrix_sample:
        samples = get_matrix_sample(n=args.top_k or 6)
        if args.json:
            print(json.dumps(samples))
        else:
            print(samples)
    elif args.inspect:
        status = get_cnn_status()
        if args.json:
            print(json.dumps(status))
        else:
            print("CNN Model Status:", status)
    elif args.product:
        try:
            results = top_k_similar(str(args.product), k=args.top_k)
            if args.json:
                print(json.dumps(results))
            else:
                for r in results:
                    print(r)
        except Exception as e:
            if args.json:
                print(json.dumps({"error": str(e)}))
            else:
                print(f"Error: {e}")
    else:
        # Fallback to positional argument if provided
        pid = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else None
        if pid:
            for r in top_k_similar(pid):
                print(r)
        else:
            print("Usage: python similarity.py --product <product_id> [--top_k 5] [--json]")

