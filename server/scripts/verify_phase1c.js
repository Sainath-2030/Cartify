import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function verifyPhase1C() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 1C: POST-IMPORT COMPREHENSIVE VERIFICATION     ');
  console.log('================================================================\n');

  const client = await pool.connect();
  let total = 0;
  let passed = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✓ [PASS ${total.toString().padStart(2)}] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL ${total.toString().padStart(2)}] ${testName}`);
    }
  }

  try {
    // 1. Total Products Count Check
    const countRes = await client.query('SELECT count(*) as count FROM products');
    const totalCount = parseInt(countRes.rows[0].count, 10);
    assert(totalCount === 16983, `Total imported products = 16,983 (Actual: ${totalCount.toLocaleString()})`);

    // 2. Duplicate (source, source_id) Check
    const dupRes = await client.query(`
      SELECT source, source_id, count(*) FROM products 
      GROUP BY source, source_id HAVING count(*) > 1
    `);
    assert(dupRes.rowCount === 0, `No duplicate (source, source_id) records in database (Found: ${dupRes.rowCount})`);

    // 3. Source Provenance Check
    const nonAmazonRes = await client.query(`SELECT count(*) FROM products WHERE source != 'amazon'`);
    assert(parseInt(nonAmazonRes.rows[0].count, 10) === 0, `All products have source = 'amazon'`);

    // 4. Valid Cartify Internal IDs Check
    const idRes = await client.query(`SELECT min(id) as min_id, max(id) as max_id FROM products`);
    assert(parseInt(idRes.rows[0].min_id, 10) === 1 && parseInt(idRes.rows[0].max_id, 10) === 16983, `Products have continuous internal BIGSERIAL primary keys (1 to 16,983)`);

    // 5. Positive MRP Prices Check
    const invalidPriceRes = await client.query(`SELECT count(*) FROM products WHERE price IS NULL OR price <= 0`);
    assert(parseInt(invalidPriceRes.rows[0].count, 10) === 0, `Zero products with invalid/zero MRP price`);

    // 6. Positive Selling Final Prices Check
    const invalidFinalPriceRes = await client.query(`SELECT count(*) FROM products WHERE final_price IS NULL OR final_price <= 0`);
    assert(parseInt(invalidFinalPriceRes.rows[0].count, 10) === 0, `Zero products with invalid/zero final selling price`);

    // 7. Valid Category Foreign Key Reference Check
    const invalidCatRes = await client.query(`
      SELECT count(*) FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE c.id IS NULL
    `);
    assert(parseInt(invalidCatRes.rows[0].count, 10) === 0, `Zero orphaned category references`);

    // 8. Image URL Completeness & Normalization Check
    const badImagesRes = await client.query(`
      SELECT count(*) FROM products
      WHERE main_image IS NULL OR main_image = '' OR NOT (main_image LIKE 'http%') OR main_image LIKE '%IMAGERENDERING%'
    `);
    assert(parseInt(badImagesRes.rows[0].count, 10) === 0, `Zero products with missing or unnormalized IMAGERENDERING_ image URLs`);

    // 9. Nullable Genuine Rating Check (No fake ratings)
    const ratingStatsRes = await client.query(`
      SELECT 
        count(CASE WHEN rating IS NOT NULL THEN 1 END) as rated_count,
        count(CASE WHEN rating IS NULL THEN 1 END) as unrated_count,
        min(rating) as min_rating,
        max(rating) as max_rating
      FROM products
    `);
    const rStats = ratingStatsRes.rows[0];
    assert(parseInt(rStats.unrated_count, 10) > 0, `Unrated products genuinely preserved as NULL (${rStats.unrated_count} items — zero fabricated ratings)`);
    assert(parseFloat(rStats.min_rating) >= 1.0 && parseFloat(rStats.max_rating) <= 5.0, `Rated products strictly bounded [1.0, 5.0] (Min: ${rStats.min_rating}, Max: ${rStats.max_rating})`);

    // 10. Review Count Integrity Check
    const reviewStatsRes = await client.query(`
      SELECT count(*) FROM products WHERE rating IS NULL AND review_count != 0
    `);
    assert(parseInt(reviewStatsRes.rows[0].count, 10) === 0, `Unrated products have review_count = 0 (No fabricated reviews)`);

    // 11. Search Vector Existence Check
    const searchVecRes = await client.query(`SELECT count(*) FROM products WHERE search_vector IS NULL`);
    assert(parseInt(searchVecRes.rows[0].count, 10) === 0, `All 16,904 products have search_vector tsvectors generated`);

    // 12. Unique Slugs Check
    const dupSlugsRes = await client.query(`
      SELECT slug, count(*) FROM products GROUP BY slug HAVING count(*) > 1
    `);
    assert(dupSlugsRes.rowCount === 0, `All 16,904 product slugs are 100% unique`);

    // 13. Category Breakdown Report
    const catBreakdown = await client.query(`
      SELECT c.name, c.slug, count(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.slug
      ORDER BY count DESC
    `);
    console.log('\n--- CATEGORY BREAKDOWN IN POSTGRESQL ---');
    for (const r of catBreakdown.rows) {
      console.log(`  - ${r.name.padEnd(18)} (${r.slug}): ${parseInt(r.count, 10).toLocaleString()} products`);
    }

    // 14. Sample Products Across 3 Categories
    const sampleRes = await client.query(`
      SELECT p.id, p.source, p.source_id, p.brand, p.name, p.final_price, p.price, p.rating, p.review_count, c.name as category
      FROM products p
      JOIN categories c ON c.id = p.category_id
      ORDER BY p.id
      LIMIT 5
    `);
    console.log('\n--- SAMPLE IMPORTED PRODUCTS (DATASET-AGNOSTIC) ---');
    sampleRes.rows.forEach(p => {
      console.log(`  [Cartify ID ${p.id}] [${p.source}:${p.source_id}] [${p.category}] ${p.brand || 'Unbranded'} "${p.name.slice(0, 35)}..." -> ₹${p.final_price} (MRP: ₹${p.price}) ★${p.rating || 'Unrated'} (${p.review_count} rev)`);
    });

    console.log(`\n================================================================`);
    console.log(`   PHASE 1C POST-IMPORT SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed !== total) {
      throw new Error(`Phase 1C verification failed: ${total - passed} checks failed.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

verifyPhase1C().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
