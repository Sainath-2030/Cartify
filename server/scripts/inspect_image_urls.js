import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function inspectImages() {
  const res = await pool.query(
    `SELECT id, name, main_image FROM products
     WHERE name ILIKE '%Portronics Clean M%' OR name ILIKE '%Nik case 7 in 1%'`
  );
  console.log('Inspecting Image URLs:');
  for (const r of res.rows) {
    console.log(`[ID ${r.id}] ${r.name}`);
    console.log(`  URL: ${r.main_image}\n`);
  }
  await pool.end();
}

inspectImages().catch(console.error);
