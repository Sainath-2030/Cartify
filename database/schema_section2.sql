-- ==========================================================
-- Cartify Database Schema — Section 2 additions
-- PostgreSQL
--
-- Adds: categories, products, and wires the interactions table
-- (created in Section 1) to real products via a foreign key.
--
-- Run this AFTER database/schema.sql (Section 1).
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT guards.
-- ==========================================================

-- ==========================================================
-- Table: categories
-- ==========================================================
CREATE TABLE IF NOT EXISTS categories (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    slug          VARCHAR(120)  NOT NULL UNIQUE,
    description   VARCHAR(500),
    image         VARCHAR(500),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

-- ==========================================================
-- Table: products
-- ==========================================================
CREATE TABLE IF NOT EXISTS products (
    id                   BIGSERIAL PRIMARY KEY,
    name                 VARCHAR(200)   NOT NULL,
    slug                 VARCHAR(220)   NOT NULL UNIQUE,
    description          TEXT,
    short_description    VARCHAR(300),
    category_id          INTEGER        REFERENCES categories(id) ON DELETE SET NULL,
    subcategory          VARCHAR(100),
    brand                VARCHAR(100)   NOT NULL,
    price                NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    discount_percentage  NUMERIC(5, 2)  NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 90),
    -- Stored (not generated) so the API can filter/sort on it directly and
    -- cheaply, without recomputing on every query.
    final_price          NUMERIC(10, 2) NOT NULL CHECK (final_price >= 0),
    rating               NUMERIC(2, 1)  NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    review_count         INTEGER        NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    stock_quantity       INTEGER        NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    seller_name          VARCHAR(150)   NOT NULL DEFAULT 'Cartify Retail',
    seller_id            INTEGER,
    main_image           VARCHAR(500)   NOT NULL,
    images                JSONB         NOT NULL DEFAULT '[]'::jsonb,  -- gallery thumbnails
    specifications         JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- key/value spec table
    is_active            BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products (final_price);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products (rating);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active);

-- Full-text search across name, brand, description, short_description.
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(short_description, '')), 'C') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'D')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN (search_vector);

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at(); -- reuses the function created in Section 1's schema.sql

-- ==========================================================
-- Wire up the interactions table (created in Section 1) to
-- real products, now that the products table exists.
-- ==========================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_interactions_product'
    ) THEN
        ALTER TABLE interactions
            ADD CONSTRAINT fk_interactions_product
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Section 2 introduces two new interaction_type values used by the
-- catalogue (product_click, category_view). Section 1 already allows
-- 'view' and 'search'; this widens the CHECK constraint to match.
ALTER TABLE interactions DROP CONSTRAINT IF EXISTS chk_interaction_type;
ALTER TABLE interactions ADD CONSTRAINT chk_interaction_type CHECK (
    interaction_type IN (
        'view', 'click', 'search', 'wishlist',
        'cart', 'purchase', 'rating', 'review',
        'product_view', 'product_click', 'category_view'
    )
);

-- ==========================================================
-- Table: reviews
-- Section 2 only implements the DISPLAY layer; this table lets us
-- seed realistic sample reviews now, and supports review submission
-- cleanly in a later section without a schema change.
-- ==========================================================
CREATE TABLE IF NOT EXISTS reviews (
    id            BIGSERIAL PRIMARY KEY,
    product_id    BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id       BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(120) NOT NULL,
    rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id);
