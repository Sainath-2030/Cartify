import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function checkPrices() {
  console.log('--- CHECKING SAMPLE PRODUCT PRICES IN POSTGRESQL ---\n');

  // Check highest priced products
  const highRes = await pool.query('SELECT id, name, price, final_price, discount_percentage FROM products ORDER BY final_price DESC LIMIT 10');
  console.log('Top 10 Highest Price Products:');
  for (const row of highRes.rows) {
    console.log(`  - [ID ${row.id}] ${row.name.slice(0, 50)}... -> ₹${row.final_price} (MRP: ₹${row.price}, ${row.discount_percentage}% off)`);
  }

  // Check phones / Samsung
  const samsungRes = await pool.query("SELECT id, name, price, final_price, discount_percentage FROM products WHERE name ILIKE '%samsung%' LIMIT 10");
  console.log('\nSamsung Products:');
  for (const row of samsungRes.rows) {
    console.log(`  - [ID ${row.id}] ${row.name.slice(0, 50)}... -> ₹${row.final_price} (MRP: ₹${row.price})`);
  }

  await pool.end();
}

checkPrices().catch(console.error);
