import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const backupDir = path.resolve(__dirname, '../../database/backups');

async function createBackup() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup_pre_rebuild_${timestamp}.json`);

  console.log(`Creating database snapshot to ${backupFile}...`);
  const client = await pool.connect();

  try {
    const tables = ['users', 'categories', 'products', 'interactions', 'reviews', 'cart_items', 'wishlist_items', 'orders', 'order_items'];
    const snapshot = {
      timestamp: new Date().toISOString(),
      tables: {},
    };

    for (const table of tables) {
      try {
        const res = await client.query(`SELECT * FROM ${table}`);
        snapshot.tables[table] = res.rows;
        console.log(`  - Backed up ${table}: ${res.rowCount} rows`);
      } catch (err) {
        console.log(`  - Table ${table} not present or empty (${err.message})`);
      }
    }

    fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2), 'utf8');
    console.log(`✓ Backup saved successfully: ${backupFile} (${(fs.statSync(backupFile).size / 1024 / 1024).toFixed(2)} MB)`);
  } finally {
    client.release();
    await pool.end();
  }
}

createBackup().catch(console.error);
