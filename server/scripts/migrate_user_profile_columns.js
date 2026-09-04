import { query, pool } from '../config/db.js';

async function migrate() {
  console.log('Running user profile columns migration...');
  try {
    await query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state VARCHAR(100),
        ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
        ADD COLUMN IF NOT EXISTS date_of_birth DATE;
    `);

    // Add unique constraint on mobile if not already exists (allowing nulls for existing records)
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_users_mobile'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT uq_users_mobile UNIQUE (mobile);
        END IF;
      END $$;
    `);

    console.log('✅ Successfully added profile columns to users table.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
