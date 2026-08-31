-- ==========================================================
-- Cartify Database Schema — Section 3: Shopping Cart (Chunk 3.1)
-- PostgreSQL
--
-- Adds: cart_items table for persistent, authenticated shopping carts.
-- Additive only — safe to re-run with IF NOT EXISTS guards.
--
-- Run AFTER schema.sql, schema_section2.sql, schema_section3_roles.sql.
-- ==========================================================

CREATE TABLE IF NOT EXISTS cart_items (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id     BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cart_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items (product_id);

-- Keep updated_at fresh automatically using set_updated_at() defined in schema.sql
DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON cart_items;
CREATE TRIGGER trg_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
