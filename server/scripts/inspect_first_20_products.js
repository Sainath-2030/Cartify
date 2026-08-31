import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function inspectFirst20Products() {
  console.log('================================================================');
  console.log('   INSPECTING FIRST 20 PRODUCTS IN POSTGRESQL DATABASE           ');
  console.log('================================================================\n');

  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT p.id, p.source, p.source_id as asin, p.name, p.brand, p.category_id, c.slug as category, p.main_image, p.price, p.final_price
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.id ASC
      LIMIT 20
    `);

    res.rows.forEach((p, idx) => {
      console.log(`[#${idx + 1}] ID: ${p.id} | ASIN: ${p.asin} | Category: ${p.category}`);
      console.log(`  Name : ${p.name}`);
      console.log(`  Brand: ${p.brand}`);
      console.log(`  Price: ₹${p.final_price} (MRP: ₹${p.price})`);
      console.log(`  Image: ${p.main_image}`);
      console.log('----------------------------------------------------------------');
    });
  } finally {
    client.release();
    await pool.end();
  }
}

inspectFirst20Products().catch(console.error);
