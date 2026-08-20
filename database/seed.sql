-- ==========================================================
-- Cartify — Optional Seed Data (Section 1)
-- Safe to run after schema.sql for local testing.
-- Password for the demo user below is: Password@123
-- (hash generated with bcrypt, 10 salt rounds)
-- ==========================================================

INSERT INTO users (
    full_name, email, password_hash, mobile,
    address, city, state, postal_code, date_of_birth
)
VALUES (
    'Demo User',
    'demo@cartify.com',
    '$2b$10$examplehash.doNotUseInProduction.replace123456789012',
    '9876543210',
    '221B Main Street',
    'Kolhapur',
    'Maharashtra',
    '416001',
    '1998-05-14'
)
ON CONFLICT (email) DO NOTHING;

-- A sample interaction row (product_id is a placeholder until Section 2).
INSERT INTO interactions (user_id, product_id, interaction_type, session_id, metadata)
SELECT id, NULL, 'view', 'seed-session-1', '{"note": "placeholder until products table exists"}'::jsonb
FROM users WHERE email = 'demo@cartify.com'
LIMIT 1;
