import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  console.log('Running Phase 1D.3 RBAC migration: Creating audit_logs and system_configs tables...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Audit Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id VARCHAR(100),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    `);

    // 2. System Configurations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_configs (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    // Seed default business rules if not already present
    const defaultBusinessRules = {
      diversityBoost: 0.15,
      minRatingThreshold: 3.5,
      maxDiscountHighlight: 0.5,
      interactionWeights: {
        VIEW: 1.0,
        SEARCH: 1.5,
        WISHLIST_ADD: 3.0,
        CART_ADD: 4.0,
        RATING: 3.5,
        REVIEW: 4.0,
        PURCHASE: 5.0,
      },
      categoryWeights: {
        fashion: 1.0,
        electronics: 1.0,
        'home-kitchen': 1.0,
        beauty: 1.0,
        sports: 1.0,
        grocery: 1.0,
        gaming: 1.0,
        books: 1.0,
      },
    };

    await client.query(
      `INSERT INTO system_configs (key, value, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO NOTHING`,
      [
        'recommendation_business_rules',
        JSON.stringify(defaultBusinessRules),
        'Global recommendation engine scoring weights, interaction values, and diversity factors.',
      ]
    );

    await client.query('COMMIT');
    console.log('✓ Phase 1D.3 RBAC migration applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
