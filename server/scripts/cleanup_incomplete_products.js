import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function auditAndClean() {
  console.log('====================================================');
  console.log('   CARTIFY PRODUCT DATA INTEGRITY & CLEANUP AUDIT   ');
  console.log('====================================================\n');

  const client = await pool.connect();

  try {
    const totalInitial = (await client.query('SELECT count(*) FROM products')).rows[0].count;
    console.log(`Current Total Products in Database: ${totalInitial}`);

    console.log('\nAuditing for incomplete, broken, or low-quality data...');

    // 1. Missing or broken images
    const badImages = await client.query(
      `SELECT id, name, main_image FROM products
       WHERE main_image IS NULL
          OR main_image = ''
          OR NOT (main_image LIKE 'http%')
          OR main_image ILIKE '%01RmB9GQpdL%'
          OR main_image ILIKE '%41ET8sUw%'
          OR main_image ILIKE '%transparent-pixel%'
          OR main_image ILIKE '%placeholder%'`
    );
    console.log(`- Products with missing/broken images: ${badImages.rowCount}`);

    // 2. Missing or too short name
    const badNames = await client.query(
      `SELECT id FROM products WHERE name IS NULL OR TRIM(name) = '' OR LENGTH(TRIM(name)) < 5`
    );
    console.log(`- Products with missing/empty names: ${badNames.rowCount}`);

    // 3. Missing or too short description
    const badDescriptions = await client.query(
      `SELECT id FROM products WHERE description IS NULL OR TRIM(description) = '' OR LENGTH(TRIM(description)) < 15`
    );
    console.log(`- Products with missing/empty descriptions: ${badDescriptions.rowCount}`);

    // 4. Invalid prices
    const badPrices = await client.query(
      `SELECT id FROM products WHERE price IS NULL OR price <= 0 OR final_price IS NULL OR final_price <= 0`
    );
    console.log(`- Products with invalid/zero prices: ${badPrices.rowCount}`);

    // 5. Missing category
    const badCategories = await client.query(
      `SELECT id FROM products WHERE category_id IS NULL`
    );
    console.log(`- Products with missing categories: ${badCategories.rowCount}`);

    // 6. Low quality / noisy brands (like '19mm', '2pairs', '12seasons', pure numbers)
    const badBrands = await client.query(
      `SELECT id, brand FROM products
       WHERE brand IS NULL
          OR TRIM(brand) = ''
          OR brand ~ '^[0-9]+$'
          OR brand ~ '^[0-9]+[a-zA-Z]+$'
          OR brand ILIKE '%2pairs%'
          OR brand ILIKE '%19mm%'
          OR brand ILIKE '%22mm%'
          OR brand ILIKE '%24x7%'
          OR brand ILIKE '%12seasons%'`
    );
    console.log(`- Products with noisy/garbled brand names: ${badBrands.rowCount}`);

    console.log('\nExecuting cleanup deletion in transaction...');
    await client.query('BEGIN');

    const deleteRes = await client.query(
      `DELETE FROM products
       WHERE main_image IS NULL
          OR main_image = ''
          OR NOT (main_image LIKE 'http%')
          OR main_image ILIKE '%01RmB9GQpdL%'
          OR main_image ILIKE '%41ET8sUw%'
          OR main_image ILIKE '%transparent-pixel%'
          OR main_image ILIKE '%placeholder%'
          OR name IS NULL
          OR TRIM(name) = ''
          OR LENGTH(TRIM(name)) < 5
          OR description IS NULL
          OR TRIM(description) = ''
          OR LENGTH(TRIM(description)) < 15
          OR price IS NULL
          OR price <= 0
          OR final_price IS NULL
          OR final_price <= 0
          OR category_id IS NULL
          OR brand IS NULL
          OR TRIM(brand) = ''
          OR brand ~ '^[0-9]+$'
          OR brand ~ '^[0-9]+[a-zA-Z]+$'
          OR brand ILIKE '%2pairs%'
          OR brand ILIKE '%19mm%'
          OR brand ILIKE '%22mm%'
          OR brand ILIKE '%24x7%'
          OR brand ILIKE '%12seasons%'`
    );

    console.log(`Deleted ${deleteRes.rowCount} incomplete or noisy product rows.`);

    // Clean up brand names that start with "Amazon Brand - " or have extra symbols
    await client.query(
      `UPDATE products
       SET brand = REPLACE(brand, 'Amazon Brand - ', ''),
           updated_at = NOW()
       WHERE brand LIKE 'Amazon Brand - %'`
    );

    await client.query('COMMIT');

    const finalTotalRes = await client.query('SELECT count(*) FROM products');
    const finalTotal = finalTotalRes.rows[0].count;

    console.log(`\n====================================================`);
    console.log(`   100% COMPLETE & VERIFIED PRODUCTS IN DATABASE: ${finalTotal}`);
    console.log(`====================================================\n`);

    // Category breakdown
    const catBreakdown = await client.query(
      `SELECT c.name, c.slug, count(p.id) as count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id, c.name, c.slug
       ORDER BY c.id`
    );

    console.log('Category breakdown:');
    for (const r of catBreakdown.rows) {
      console.log(`  - ${r.name} (${r.slug}): ${r.count} complete products`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Audit and cleanup error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

auditAndClean().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
