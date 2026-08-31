"""
Read-only access from the ML service into Cartify's existing PostgreSQL
database. This service NEVER writes to the app's tables — it only reads
`products` and `interactions` and produces artifacts under ml-service/data
and ml-service/artifacts.

This keeps the ML layer decoupled from server/ as required by CLAUDE.MD
(Section 2: "web application and ML system must remain modular and loosely
coupled").
"""
import os
import pandas as pd
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    # Prefer DATABASE_URL to match server/config/db.js's convention exactly
    # (one connection string, defined once). Falls back to discrete PG_*
    # vars if only those are set.
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url)
    return psycopg2.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=os.getenv("PG_PORT", "5432"),
        dbname=os.getenv("PG_DATABASE", "cartify"),
        user=os.getenv("PG_USER", "cartify_user"),
        password=os.getenv("PG_PASSWORD", ""),
    )


def load_interactions() -> pd.DataFrame:
    """
    Returns raw interaction events: user_id, product_id, interaction_type,
    created_at. NCF needs these turned into implicit-feedback (user, item,
    label) pairs — that mapping happens in ncf/dataset.py, not here, so this
    stays a thin, reusable data-access function.
    """
    query = """
        SELECT user_id, product_id, interaction_type, created_at
        FROM interactions
        WHERE product_id IS NOT NULL
        ORDER BY created_at ASC
    """
    with get_connection() as conn:
        return pd.read_sql(query, conn)


def load_products() -> pd.DataFrame:
    """
    Returns product catalogue rows needed by both models:
    - id, category_id, brand: NCF item-side metadata (optional feature enrichment)
    - main_image: CNN visual feature extraction input
    """
    query = """
        SELECT id, category_id, brand, price, final_price, main_image
        FROM products
        WHERE is_active = TRUE
    """
    with get_connection() as conn:
        return pd.read_sql(query, conn)


if __name__ == "__main__":
    # Quick manual sanity check: python -m common.db
    inter = load_interactions()
    prod = load_products()
    print(f"interactions: {len(inter)} rows - db.py:71")
    print(f"products: {len(prod)} rows - db.py:72")
