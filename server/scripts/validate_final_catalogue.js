import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function validateCatalogue() {
  console.log('================================================================');
  console.log('   CARTIFY FINAL CATALOGUE AUTOMATED INTEGRITY GATE             ');
  console.log('================================================================\n');

  const client = await pool.connect();
  let failures = 0;

  function check(passed, message) {
    if (passed) {
      console.log(`✓ [PASS] ${message}`);
    } else {
      console.error(`✗ [FAIL] ${message}`);
      failures++;
    }
  }

  try {
    // 1. Total product count
    const countRes = await client.query('SELECT COUNT(*) as total FROM products');
    const total = parseInt(countRes.rows[0].total, 10);
    check(total >= 10000, `Total products in database: ${total} (Expected >= 10,000)`);

    // 2. Active categories
    const catRes = await client.query(`
      SELECT c.id, c.name, c.slug, count(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.id
    `);
    check(catRes.rows.length === 8, `All 8 departments active in database`);
    console.table(catRes.rows);

    for (const cat of catRes.rows) {
      const pCount = parseInt(cat.product_count, 10);
      check(pCount > 0, `Department [${cat.name}] has valid products (${pCount})`);
    }

    // 3. Duplicate ASIN check
    const dupAsinRes = await client.query(`
      SELECT source, source_id, COUNT(*) as count
      FROM products
      WHERE source_id IS NOT NULL AND source_id != ''
      GROUP BY source, source_id
      HAVING COUNT(*) > 1
    `);
    check(dupAsinRes.rows.length === 0, `Zero duplicate ASINs (Found: ${dupAsinRes.rows.length})`);

    // 4. Duplicate fingerprint check
    const dupFpRes = await client.query(`
      SELECT lower(replace(name, ' ', '')) as fp, COUNT(*) as count
      FROM products
      GROUP BY lower(replace(name, ' ', ''))
      HAVING COUNT(*) > 1
    `);
    check(dupFpRes.rows.length === 0, `Zero duplicate product title fingerprints (Found: ${dupFpRes.rows.length})`);

    // 5. Invalid prices check
    const badPriceRes = await client.query(`
      SELECT COUNT(*) as bad_count
      FROM products
      WHERE price <= 0 OR final_price <= 0 OR final_price > price
    `);
    check(parseInt(badPriceRes.rows[0].bad_count, 10) === 0, `Zero invalid prices (Found: ${badPriceRes.rows[0].bad_count})`);

    // 6. Missing names or short names
    const badNameRes = await client.query(`
      SELECT COUNT(*) as bad_count
      FROM products
      WHERE name IS NULL OR length(trim(name)) < 6
    `);
    check(parseInt(badNameRes.rows[0].bad_count, 10) === 0, `Zero missing or invalid product names`);

    // 7. Placeholder / broken image hashes
    const badImgRes = await client.query(`
      SELECT COUNT(*) as bad_count
      FROM products
      WHERE main_image IS NULL OR NOT (main_image LIKE 'http%')
        OR main_image LIKE '%01RmB9GQpdL%' OR main_image LIKE '%41ET8sUw-mL%'
        OR main_image LIKE '%transparent-pixel%' OR main_image LIKE '%no-image%'
    `);
    check(parseInt(badImgRes.rows[0].bad_count, 10) === 0, `Zero placeholder or broken images`);

    // 8. Beauty domain contradiction check (diapers, pampers, straws)
    const beautyViolations = await client.query(`
      SELECT COUNT(*) as violations
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE c.slug = 'beauty'
        AND (
          p.name ILIKE '%diaper%' OR p.name ILIKE '%pampers%' OR p.name ILIKE '%huggies%'
          OR p.name ILIKE '%munchkin%' OR p.name ILIKE '%straw%' OR p.name ILIKE '%feeder%'
          OR p.name ILIKE '%rash ointment%' OR p.name ILIKE '%pacifier%' OR p.name ILIKE '%thermometer%'
        )
    `);
    check(parseInt(beautyViolations.rows[0].violations, 10) === 0, `Zero nursery/diaper violations in Beauty (Found: ${beautyViolations.rows[0].violations})`);

    // 9. Fashion domain contradiction check (luggage racks, retainer cases, toys)
    const fashionViolations = await client.query(`
      SELECT COUNT(*) as violations
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE c.slug = 'fashion'
        AND (
          p.name ILIKE '%luggage rack%' OR p.name ILIKE '%retainer case%' OR p.name ILIKE '%fisher-price%'
          OR p.name ILIKE '%soft toy%' OR p.name ILIKE '%storage bag%' OR p.name ILIKE '%drying stand%'
        )
    `);
    check(parseInt(fashionViolations.rows[0].violations, 10) === 0, `Zero furniture/medical/toy violations in Fashion (Found: ${fashionViolations.rows[0].violations})`);

    // 10. Gaming domain contradiction check (generic HDMI cables, Ethernet adapters)
    const gamingViolations = await client.query(`
      SELECT COUNT(*) as violations
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE c.slug = 'gaming'
        AND (
          p.name ILIKE '%hdmi cable%' OR p.name ILIKE '%vga%' OR p.name ILIKE '%rj45%'
          OR p.name ILIKE '%ethernet adapter%' OR p.name ILIKE '%tv bracket%'
        )
    `);
    check(parseInt(gamingViolations.rows[0].violations, 10) === 0, `Zero generic cable violations in Gaming (Found: ${gamingViolations.rows[0].violations})`);

    // 11. Search vector verification
    const searchRes = await client.query("SELECT COUNT(*) as total FROM products WHERE search_vector @@ plainto_tsquery('english', 'headphones')");
    check(parseInt(searchRes.rows[0].total, 10) > 0, `Search vector functional (Found ${searchRes.rows[0].total} items for "headphones")`);

    console.log(`\n================================================================`);
    if (failures === 0) {
      console.log('   ✓ ALL FINAL CATALOGUE INTEGRITY CHECKS PASSED (100%)         ');
      console.log('================================================================\n');
      process.exit(0);
    } else {
      console.error(`   ✗ CATALOGUE INTEGRITY FAILED WITH ${failures} ERRORS`);
      console.log('================================================================\n');
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

validateCatalogue().catch((err) => {
  console.error('Validation error:', err);
  process.exit(1);
});
