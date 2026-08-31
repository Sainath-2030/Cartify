import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function verifyDatabaseState() {
  console.log('--- REBUILD DATABASE VALIDATION ---');
  
  // Users
  const userRes = await pool.query('SELECT id, email, full_name, role FROM users ORDER BY id');
  console.log('\n1. Users & Roles:');
  userRes.rows.forEach(u => console.log(`   [ID ${u.id}] ${u.email} (${u.role}) - ${u.full_name}`));

  // Products
  const prodStats = await pool.query(`
    SELECT 
      count(*) as total,
      count(CASE WHEN source = 'amazon' THEN 1 END) as amazon_count,
      count(CASE WHEN source = 'internal' THEN 1 END) as internal_count,
      count(CASE WHEN main_image LIKE '%IMAGERENDERING%' THEN 1 END) as bad_urls,
      count(CASE WHEN price <= 0 OR final_price <= 0 THEN 1 END) as zero_prices,
      count(CASE WHEN search_vector IS NULL THEN 1 END) as missing_search_vector
    FROM products
  `);
  console.log('\n2. Product Table Health:');
  console.log(`   Total Products: ${prodStats.rows[0].total}`);
  console.log(`   Amazon Sourced: ${prodStats.rows[0].amazon_count}`);
  console.log(`   Internally Sourced: ${prodStats.rows[0].internal_count}`);
  console.log(`   Expired IMAGERENDERING URLs: ${prodStats.rows[0].bad_urls} (Must be 0)`);
  console.log(`   Zero/Invalid Prices: ${prodStats.rows[0].zero_prices} (Must be 0)`);
  console.log(`   Missing Search Vectors: ${prodStats.rows[0].missing_search_vector} (Must be 0)`);

  // Sample Products across 3 categories
  const sampleRes = await pool.query(`
    SELECT p.id, p.source, p.source_id, p.brand, p.name, p.final_price, p.price, p.rating, p.review_count, c.name as category
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE c.slug IN ('fashion', 'electronics', 'beauty')
    ORDER BY p.id
    LIMIT 6
  `);
  console.log('\n3. Sample Dataset-Independent Products:');
  sampleRes.rows.forEach(p => {
    console.log(`   [ID ${p.id}] [${p.source}:${p.source_id}] [${p.category}] ${p.brand} "${p.name.slice(0, 40)}..." -> ₹${p.final_price} (MRP: ₹${p.price}) ★${p.rating} (${p.review_count} rev)`);
  });

  await pool.end();
}

verifyDatabaseState().catch(console.error);
