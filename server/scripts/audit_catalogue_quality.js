import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function runAudit() {
  console.log('=== CATALOGUE QUALITY AUDIT ===\n');

  // 1. Total products and distribution by category
  const catDist = await pool.query(`
    SELECT c.id, c.name, c.slug, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.slug
    ORDER BY c.id
  `);
  console.log('--- CATEGORY DISTRIBUTION ---');
  console.table(catDist.rows);

  // 2. Duplicate ASIN / source_id
  const dupSource = await pool.query(`
    SELECT source, source_id, COUNT(*) as count, array_agg(id) as product_ids, array_agg(name) as names
    FROM products
    WHERE source_id IS NOT NULL AND source_id != ''
    GROUP BY source, source_id
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 20
  `);
  console.log(`\n--- DUPLICATE SOURCE_IDs (${dupSource.rows.length} found in top 20) ---`);
  if (dupSource.rows.length > 0) {
    console.log(JSON.stringify(dupSource.rows.slice(0, 5), null, 2));
  } else {
    console.log('No duplicate source_id found.');
  }

  // 3. Duplicate Product Names
  const dupNames = await pool.query(`
    SELECT lower(trim(name)) as norm_name, COUNT(*) as count, array_agg(id) as product_ids
    FROM products
    GROUP BY lower(trim(name))
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 20
  `);
  console.log(`\n--- DUPLICATE PRODUCT NAMES (${dupNames.rows.length} found in top 20) ---`);
  console.table(dupNames.rows.slice(0, 10));

  // 4. Duplicate Image URLs across different products
  const dupImages = await pool.query(`
    SELECT main_image, COUNT(DISTINCT id) as product_count, array_agg(name) as sample_names
    FROM products
    WHERE main_image IS NOT NULL AND main_image != ''
    GROUP BY main_image
    HAVING COUNT(DISTINCT id) > 1
    ORDER BY product_count DESC
    LIMIT 20
  `);
  console.log(`\n--- DUPLICATE IMAGE URLs (${dupImages.rows.length} found in top 20) ---`);
  console.table(dupImages.rows.slice(0, 10));

  // 5. Category Violations Audit
  // Beauty with Diapers/Pampers/Straws/Wipes
  const beautyViolations = await pool.query(`
    SELECT p.id, p.name, p.brand, p.subcategory, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = 'beauty'
      AND (
        p.name ILIKE '%diaper%' OR p.name ILIKE '%pampers%' OR p.name ILIKE '%munchkin%'
        OR p.name ILIKE '%straw%' OR p.name ILIKE '%wipe%' OR p.name ILIKE '%rash ointment%'
        OR p.name ILIKE '%baby%' OR p.name ILIKE '%feeder%' OR p.name ILIKE '%pacifier%'
      )
    LIMIT 20
  `);
  console.log(`\n--- BEAUTY VIOLATIONS (Baby/Diapers in Beauty: ${beautyViolations.rows.length}) ---`);
  console.table(beautyViolations.rows.slice(0, 10));

  // Fashion with Luggage Racks, Toys, Retainers, Keychains
  const fashionViolations = await pool.query(`
    SELECT p.id, p.name, p.brand, p.subcategory, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = 'fashion'
      AND (
        p.name ILIKE '%luggage rack%' OR p.name ILIKE '%retainer case%' OR p.name ILIKE '%fisher-price%'
        OR p.name ILIKE '%toy%' OR p.name ILIKE '%furniture%' OR p.name ILIKE '%straw%'
      )
    LIMIT 20
  `);
  console.log(`\n--- FASHION VIOLATIONS (Toys/Furniture/Medical in Fashion: ${fashionViolations.rows.length}) ---`);
  console.table(fashionViolations.rows.slice(0, 10));

  // Gaming with Generic Electronics/Cables
  const gamingViolations = await pool.query(`
    SELECT p.id, p.name, p.brand, p.subcategory, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = 'gaming'
      AND (
        p.name ILIKE '%hdmi%' OR p.name ILIKE '%vga%' OR p.name ILIKE '%adapter%'
        OR p.name ILIKE '%cable%' OR p.name ILIKE '%charger%' OR p.name ILIKE '%headphone hanger%'
      )
    LIMIT 20
  `);
  console.log(`\n--- GAMING VIOLATIONS (Cables/Adapters in Gaming: ${gamingViolations.rows.length}) ---`);
  console.table(gamingViolations.rows.slice(0, 10));

  // Grocery Coffee Domination Check
  const groceryCoffee = await pool.query(`
    SELECT 
      COUNT(*) as total_grocery,
      COUNT(*) FILTER (WHERE p.name ILIKE '%coffee%') as coffee_count,
      COUNT(*) FILTER (WHERE p.name ILIKE '%tea%') as tea_count,
      COUNT(*) FILTER (WHERE p.name ILIKE '%snack%' OR p.name ILIKE '%chocolate%' OR p.name ILIKE '%biscuit%' OR p.name ILIKE '%cookie%') as snack_count
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE c.slug = 'grocery'
  `);
  console.log('\n--- GROCERY SUB-DISTRIBUTION ---');
  console.table(groceryCoffee.rows);

  await pool.end();
}

runAudit().catch(console.error);
