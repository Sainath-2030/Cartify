-- ==========================================================
-- Cartify — Role Foundation (Actor-Based Interfaces, Chunk 1)
-- PostgreSQL
--
-- Adds role-based access control to the existing `users` table.
-- Additive only — no destructive changes. Safe to re-run.
--
-- Roles:
--   USER             - default, existing shopper accounts
--   ADMIN            - SRS Administrator (analytics, models, retraining, business rules)
--   CONTENT_MANAGER  - SRS Content Manager (catalogue/item management)
--
-- Run AFTER schema.sql, schema_section2.sql.
-- ==========================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER';

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (
  role IN ('USER', 'ADMIN', 'CONTENT_MANAGER')
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ==========================================================
-- Dev/testing helper (NOT run automatically):
-- Promote an existing account to Admin or Content Manager, e.g.:
--
--   UPDATE users SET role = 'ADMIN' WHERE email = 'demo@cartify.com';
--   UPDATE users SET role = 'CONTENT_MANAGER' WHERE email = 'someone@cartify.com';
--
-- There is intentionally no self-service way to become ADMIN/CONTENT_MANAGER
-- via /api/auth/register — role assignment is an operator/admin action.
-- ==========================================================