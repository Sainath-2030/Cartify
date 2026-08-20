-- ==========================================================
-- Cartify Database Schema — Section 1
-- PostgreSQL
--
-- This schema covers:
--   - users              (Section 1: auth + profile)
--   - interactions       (Section 1: foundation for the future
--                          recommendation engine — NCF, GRU, etc.)
--
-- Forward-compatibility notes:
--   - products.id does not exist yet (Section 2). interactions.product_id
--     is declared WITHOUT a foreign key constraint for now, so it can be
--     wired to a real `products` table later without breaking existing
--     rows. A comment marks exactly where that FK should be added.
--   - metadata is JSONB so future interaction types (e.g. GRU session
--     ordering, CNN content features) can attach arbitrary structured
--     data without a migration.
-- ==========================================================

-- Required for gen_random_uuid() if you prefer UUID ids later.
-- Not used by default (we use SERIAL/BIGSERIAL for simplicity).
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================================
-- Table: users
-- ==========================================================
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    mobile          VARCHAR(15)   NOT NULL UNIQUE,
    address         VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    postal_code     VARCHAR(20),
    date_of_birth   DATE,
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Keep updated_at fresh automatically.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ==========================================================
-- Table: interactions
--
-- Foundation for the future hybrid recommendation engine.
--   - NCF   -> reads (user_id, product_id, interaction_type)
--   - GRU   -> reads ordered rows per user_id/session_id via timestamp
--   - CNN   -> reads product content offline (not from this table)
--   - Autoencoder -> reads sparse user/product interaction rows
-- ==========================================================
CREATE TABLE IF NOT EXISTS interactions (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- NOTE: No FK constraint yet — the `products` table is introduced in
    -- Section 2. Add this once it exists:
    --   ALTER TABLE interactions
    --     ADD CONSTRAINT fk_interactions_product
    --     FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    product_id        BIGINT,

    interaction_type  VARCHAR(20) NOT NULL,
    session_id        VARCHAR(100),        -- groups events for GRU sequence modeling
    metadata          JSONB DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_interaction_type CHECK (
        interaction_type IN (
            'view', 'click', 'search', 'wishlist',
            'cart', 'purchase', 'rating', 'review'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions (user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_product_id ON interactions (product_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions (interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON interactions (session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions (created_at);
