import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function checkFashion() {
  console.log('--- FIRST 15 FASHION PRODUCTS IN DATABASE ---\n');
  const res = await pool.query(
    `SELECT p.id, p.brand, p.subcategory, p.name, p.final_price, p.price, p.main_image
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE c.slug = 'fashion'
     LIMIT 15`
  );
  for (const row of res.rows) {
    console.log(`[${row.brand}] (${row.subcategory}) "${row.name.slice(0, 50)}..." -> ₹${row.final_price} (MRP: ₹${row.price}) | Image: ${row.main_image.slice(0, 60)}...`);
  }

  console.log('\n--- TOP FASHION BRANDS ---');
  const brandsRes = await pool.query(
    `SELECT p.brand, count(*) as cnt
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE c.slug = 'fashion'
     GROUP BY p.brand
     ORDER BY cnt DESC
     LIMIT 15`
  );
  for (const b of brandsRes.rows) {
    console.log(`  - ${b.brand}: ${b.cnt} products`);
  }

  await pool.end();
}

checkFashion().catch(console.error);
