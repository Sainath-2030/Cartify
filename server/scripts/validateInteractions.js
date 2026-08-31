/**
 * Cartify — Recommendation Pipeline Data Validation Report
 *
 * Section 4 (Recommendation Data Pipeline). Queries the live interactions
 * table and prints a data-quality report: volume, coverage, and anything
 * that would silently hurt NCF/GRU training later (orphaned product_ids,
 * users with too few events, guest/session gaps).
 *
 * This does NOT modify any data — read-only report, same spirit as
 * validateProducts.js.
 *
 * Usage (from the server/ folder):
 *   node scripts/validateInteractions.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found. Make sure server/.env is configured.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows: totalRows } = await pool.query('SELECT COUNT(*) FROM interactions');
    const total = Number(totalRows[0].count);

    const { rows: byType } = await pool.query(
      `SELECT interaction_type, COUNT(*) AS count
       FROM interactions GROUP BY interaction_type ORDER BY count DESC`
    );

    const { rows: nullProduct } = await pool.query(
      `SELECT COUNT(*) FROM interactions WHERE product_id IS NULL`
    );

    const { rows: nullSession } = await pool.query(
      `SELECT COUNT(*) FROM interactions WHERE session_id IS NULL`
    );

    // Would only be non-zero if the FK migration hasn't been applied yet.
    const { rows: orphanedProduct } = await pool.query(
      `SELECT COUNT(*) FROM interactions i
       WHERE i.product_id IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = i.product_id)`
    );

    const { rows: userCoverage } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users) AS total_users,
         (SELECT COUNT(DISTINCT user_id) FROM interactions) AS users_with_interactions`
    );

    const { rows: perUserCounts } = await pool.query(
      `SELECT user_id, COUNT(*) AS event_count
       FROM interactions GROUP BY user_id`
    );
    const usersUnderFive = perUserCounts.filter((r) => Number(r.event_count) < 5).length;

    const { rows: dateRange } = await pool.query(
      `SELECT MIN(created_at) AS earliest, MAX(created_at) AS latest FROM interactions`
    );

    console.log('=== Cartify Recommendation Pipeline — Interaction Data Report ===\n');
    console.log(`Total interaction rows: ${total}`);
    console.log(`Date range: ${dateRange[0].earliest ?? 'n/a'} -> ${dateRange[0].latest ?? 'n/a'}\n`);

    console.log('By interaction_type:');
    for (const row of byType) {
      console.log(`  ${row.interaction_type.padEnd(20)} ${row.count}`);
    }

    console.log(`\nRows with NULL product_id: ${nullProduct[0].count} (expected for 'search'/'category_view')`);
    console.log(`Rows with NULL session_id: ${nullSession[0].count}`);
    console.log(`Rows referencing a product_id that no longer exists: ${orphanedProduct[0].count}` +
      (Number(orphanedProduct[0].count) > 0 ? '  <-- run the Section 4 FK migration' : ''));

    console.log(
      `\nUsers with >=1 interaction: ${userCoverage[0].users_with_interactions} / ${userCoverage[0].total_users} total users`
    );
    console.log(`Users with fewer than 5 events (too sparse for reliable NCF training): ${usersUnderFive}`);

    console.log('\n--- Known pipeline limitation (Section 3 not yet built) ---');
    console.log(
      "Only 'product_view', 'product_click', 'search', and 'category_view' are\n" +
      'currently recorded (see server/services/interactionService.js VALID_TYPES).\n' +
      'There is no cart/wishlist/purchase/rating signal yet — those are planned\n' +
      "in Section 3 (Section 21 of CLAUDE.MD). NCF trained on browse-only signals\n" +
      'will reflect interest, not purchase intent, until that lands.'
    );

    console.log('\n--- Known pipeline limitation (guest events) ---');
    console.log(
      'Guest (unauthenticated) interactions are currently NOT persisted at all\n' +
      "(see InteractionService.record — 'guest_session_not_persisted'). All rows\n" +
      'in this table belong to logged-in users only.'
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
