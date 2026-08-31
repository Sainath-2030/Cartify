import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function migrate() {
  const sql = fs.readFileSync(path.resolve(__dirname, '../../database/schema_section3_wishlist.sql'), 'utf8');
  await pool.query(sql);
  console.log('Wishlist migration applied successfully!');
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wishlist_items'");
  console.log('Verified table existence:', res.rows);
  await pool.end();
}
migrate().catch(e => { console.error('Migration failed:', e); process.exit(1); });
