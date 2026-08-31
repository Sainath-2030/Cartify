import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function inspectWImages() {
  const wCountRes = await pool.query(
    `SELECT count(*) FROM products WHERE main_image LIKE '%IMAGERENDERING%'`
  );
  console.log(`Products with IMAGERENDERING in URL: ${wCountRes.rows[0].count}`);

  const sampleRes = await pool.query(
    `SELECT id, name, main_image FROM products WHERE main_image LIKE '%IMAGERENDERING%' LIMIT 5`
  );
  console.log('\nSample IMAGERENDERING URLs:');
  for (const r of sampleRes.rows) {
    console.log(`[ID ${r.id}] ${r.name.slice(0, 40)}...`);
    console.log(`  Raw: ${r.main_image}`);
    const fixed = r.main_image.replace(/\/images\/W\/IMAGERENDERING_[^/]+\/images\//, '/images/');
    console.log(`  Fixed: ${fixed}\n`);
  }

  // Also check if we can simply normalize all products by replacing /images/W/IMAGERENDERING_.../images/ with /images/
  // OR delete products that have dead images.
  await pool.end();
}

inspectWImages().catch(console.error);
