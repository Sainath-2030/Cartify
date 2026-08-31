/**
 * Cartify — Recommendation Data Export
 *
 * Section 4 (Recommendation Data Pipeline). Exports a clean, timestamped
 * snapshot of interactions + active products to CSV, so the ml-service
 * (NCF/CNN training) has a reproducible, versioned dataset instead of
 * always training against a live-changing table.
 *
 * ml-service/common/db.py can keep reading Postgres directly for
 * convenience during development, but for anything you want to be able to
 * re-run and compare later (e.g. "did HR@10 improve after Section 3 adds
 * cart/purchase events?"), export a snapshot first with this script.
 *
 * Usage (from the server/ folder):
 *   node scripts/exportRecommendationData.js
 *
 * Output:
 *   server/data-export/<timestamp>/interactions.csv
 *   server/data-export/<timestamp>/products.csv
 *   server/data-export/<timestamp>/manifest.json
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

function toCsv(rows, columns) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((col) => escape(row[col])).join(',')).join('\n');
  return `${header}\n${body}\n`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found. Make sure server/.env is configured.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows: interactions } = await pool.query(
      `SELECT id, user_id, product_id, interaction_type, session_id, created_at
       FROM interactions
       ORDER BY created_at ASC`
    );

    const { rows: products } = await pool.query(
      `SELECT id, category_id, brand, price, final_price, main_image
       FROM products
       WHERE is_active = TRUE`
    );

    if (interactions.length === 0) {
      console.warn(
        'WARNING: 0 interaction rows found. Exporting anyway, but this ' +
        'snapshot will be empty — NCF training needs real interaction data.'
      );
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = path.resolve(__dirname, '../data-export', timestamp);
    fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(
      path.join(outDir, 'interactions.csv'),
      toCsv(interactions, ['id', 'user_id', 'product_id', 'interaction_type', 'session_id', 'created_at'])
    );
    fs.writeFileSync(
      path.join(outDir, 'products.csv'),
      toCsv(products, ['id', 'category_id', 'brand', 'price', 'final_price', 'main_image'])
    );

    const manifest = {
      exported_at: new Date().toISOString(),
      interaction_row_count: interactions.length,
      product_row_count: products.length,
      interaction_types_present: [...new Set(interactions.map((r) => r.interaction_type))],
      source: 'Cartify PostgreSQL (interactions, products) via server/scripts/exportRecommendationData.js',
      note:
        'No cart/wishlist/purchase interaction types yet — Section 3 (Shopping ' +
        'Experience) has not been implemented. Guest interactions are not ' +
        'included; they are not persisted server-side (see interactionService.js).',
    };
    fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    console.log(`Exported ${interactions.length} interactions and ${products.length} products to:`);
    console.log(`  ${outDir}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Export script failed:', err);
  process.exit(1);
});
