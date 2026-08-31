-- Section 4 — Recommendation Data Pipeline
-- Additive migration. Safe to re-run.
--
-- 1. Adds the interactions -> products FK that schema.sql's own comment
--    said to add "once it exists" (products didn't exist yet in Section 1;
--    it does now, from Section 2).
-- 2. Adds a composite index for session-ordered reads, which the pipeline
--    (and the future GRU sequence model, Section 7) needs to pull a user's
--    session events in chronological order efficiently.
--
-- Run manually with psql, same as the rest of database/:
--   psql -U <user> -d cartify -f database/schema_section4_recommendation_pipeline.sql

BEGIN;

-- Guard: only add the FK if it doesn't already exist (idempotent re-run).
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

CREATE INDEX IF NOT EXISTS idx_interactions_session_created
    ON interactions (session_id, created_at);

COMMIT;
