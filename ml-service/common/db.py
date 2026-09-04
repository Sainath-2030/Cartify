"""
Read-only PostgreSQL access for Cartify ML service.
Loads interactions and products tables into pandas DataFrames.
"""
import os
from urllib.parse import urlparse, unquote
from dotenv import load_dotenv
import pandas as pd
import psycopg2

# Load .env from ml-service root or fallback to server/.env
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_env = os.path.join(current_dir, "..", ".env")
server_env = os.path.join(current_dir, "..", "..", "server", ".env")

if os.path.exists(ml_env):
    load_dotenv(ml_env)
elif os.path.exists(server_env):
    load_dotenv(server_env)
else:
    load_dotenv()


def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL is not defined in environment variables.")

    # Parse URL if needed
    parsed = urlparse(database_url)
    username = parsed.username
    password = unquote(parsed.password) if parsed.password else None
    database = parsed.path.lstrip("/")
    hostname = parsed.hostname or "localhost"
    port = parsed.port or 5432

    return psycopg2.connect(
        dbname=database,
        user=username,
        password=password,
        host=hostname,
        port=port
    )


def load_interactions() -> pd.DataFrame:
    """
    Loads all interactions with valid user_id and product_id from PostgreSQL.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            query = """
                SELECT 
                    id,
                    user_id,
                    session_id,
                    product_id,
                    interaction_type::text AS interaction_type,
                    metadata,
                    created_at
                FROM interactions
                WHERE product_id IS NOT NULL 
                  AND user_id IS NOT NULL
                ORDER BY created_at ASC;
            """
            cur.execute(query)
            rows = cur.fetchall()
            cols = [desc[0] for desc in cur.description]
            return pd.DataFrame(rows, columns=cols)
    finally:
        conn.close()


def load_products() -> pd.DataFrame:
    """
    Loads products from PostgreSQL.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            query = """
                SELECT 
                    id,
                    name,
                    main_image,
                    price,
                    final_price,
                    rating,
                    category_id,
                    brand
                FROM products
                ORDER BY id ASC;
            """
            cur.execute(query)
            rows = cur.fetchall()
            cols = [desc[0] for desc in cur.description]
            return pd.DataFrame(rows, columns=cols)
    finally:
        conn.close()
