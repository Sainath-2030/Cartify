-- ==========================================================
-- Cartify Database Schema — Section 3: Wishlist (Chunk 3.2)
-- PostgreSQL
--
-- Adds: wishlist_items table for persistent, authenticated wishlists.
-- Additive only — safe to re-run with IF NOT EXISTS guards.
--
-- Run AFTER schema.sql, schema_section2.sql, schema_section3_roles.sql.
-- ==========================================================

CREATE TABLE IF NOT EXISTS wishlist_items (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id     BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items (user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items (product_id);
