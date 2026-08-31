import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function verifyTaxonomyAndSamples() {
  console.log('================================================================');
  console.log('   30-PRODUCT MULTI-CATEGORY DATA ACCURACY & PURITY AUDIT      ');
  console.log('================================================================\n');

  const client = await pool.connect();
  try {
    const categories = ['fashion', 'electronics', 'home-kitchen', 'beauty', 'sports', 'grocery', 'gaming'];

    for (const cat of categories) {
      console.log(`\n================================================================`);
      console.log(`>>> DEPARTMENT: [${cat.toUpperCase()}]`);
      console.log(`================================================================`);

      const res = await client.query(`
        SELECT p.id, p.source_id as asin, p.name, p.brand, p.subcategory, p.final_price, p.price, p.rating, p.review_count, p.main_image
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE c.slug = $1
        ORDER BY p.id ASC
        LIMIT 5
      `, [cat]);

      res.rows.forEach((p, idx) => {
        console.log(`\n  [#${idx + 1}] ID: ${p.id} | ASIN: ${p.asin}`);
        console.log(`    Name       : ${p.name}`);
        console.log(`    Brand      : ${p.brand || '(None)'}`);
        console.log(`    Subcategory: ${p.subcategory}`);
        console.log(`    Price      : ₹${p.final_price} (MRP: ₹${p.price})`);
        console.log(`    Rating     : ★${p.rating || 'Unrated'} (${p.review_count} rev)`);
        console.log(`    Image URL  : ${p.main_image}`);
      });
    }
  } finally {
    client.release();
    await pool.end();
  }
}

verifyTaxonomyAndSamples().catch(console.error);
