-- ==============================================================================
-- CARTIFY COMPLETE REBUILD DATABASE SCHEMA (PostgreSQL)
-- Phase 1A: Database Foundation
-- Multi-Role, Dataset-Independent, Telemetry & E-Commerce Core
-- ==============================================================================

-- 1. ENUMS
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'CONTENT_MANAGER');

DROP TYPE IF EXISTS interaction_type CASCADE;
CREATE TYPE interaction_type AS ENUM (
    'VIEW', 'SEARCH', 'WISHLIST_ADD', 'WISHLIST_REMOVE', 
    'CART_ADD', 'CART_REMOVE', 'PURCHASE', 'RATING', 'REVIEW'
);

DROP TYPE IF EXISTS order_status CASCADE;
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- 2. USERS TABLE
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role user_role DEFAULT 'USER' NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. CATEGORIES TABLE
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(80) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. PRODUCTS TABLE (Dataset-Independent Architecture)
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(50) DEFAULT 'cartify' NOT NULL,        -- 'amazon', 'flipkart', 'internal'
    source_id VARCHAR(100),                               -- External ASIN / SKU / ID
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    brand VARCHAR(100),                                   -- Optional / Clean brand name
    category_id INT REFERENCES categories(id) ON DELETE RESTRICT NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,                                     -- Optional description
    short_description VARCHAR(500),
    price NUMERIC(10, 2) NOT NULL,                        -- MRP / Original Price
    discount_percentage NUMERIC(5, 2) DEFAULT 0 NOT NULL, -- Computed discount %
    final_price NUMERIC(10, 2) NOT NULL,                  -- Actual Selling Price
    rating NUMERIC(3, 2),                                 -- Genuine rating or NULL if unrated
    review_count INT DEFAULT 0 NOT NULL,                  -- Genuine rating count
    stock_quantity INT DEFAULT 50 NOT NULL,               -- Application-level prototype inventory
    seller_name VARCHAR(120) DEFAULT 'Cartify Verified Seller',
    main_image TEXT NOT NULL,                             -- Verified responding image URL
    images JSONB DEFAULT '[]'::jsonb NOT NULL,
    specifications JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_product_source_id UNIQUE (source, source_id)
);

-- 5. INTERACTIONS TABLE (Telemetry pipeline for AI/ML Recommendation Models)
DROP TABLE IF EXISTS interactions CASCADE;
CREATE TABLE interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    interaction_type interaction_type NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. REVIEWS TABLE
DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    reviewer_name VARCHAR(120) NOT NULL,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
    review_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_user_product_review UNIQUE (product_id, user_id)
);

-- 7. SHOPPING CART TABLE
DROP TABLE IF EXISTS cart_items CASCADE;
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    quantity INT CHECK (quantity > 0) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_cart_user_product UNIQUE (user_id, product_id)
);

-- 8. WISHLIST TABLE
DROP TABLE IF EXISTS wishlist_items CASCADE;
CREATE TABLE wishlist_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
);

-- 9. ORDERS & ORDER ITEMS TABLES
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status order_status DEFAULT 'PENDING' NOT NULL,
    shipping_address JSONB NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'SIMULATED_GATEWAY',
    payment_status VARCHAR(50) DEFAULT 'PAID',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TABLE IF EXISTS order_items CASCADE;
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id BIGINT REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
    quantity INT CHECK (quantity > 0) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL
);

-- 10. PERFORMANCE & SEARCH INDEXES
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(final_price);
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_search ON products USING gin(search_vector);

CREATE INDEX idx_interactions_user ON interactions(user_id);
CREATE INDEX idx_interactions_session ON interactions(session_id);
CREATE INDEX idx_interactions_product ON interactions(product_id);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);
