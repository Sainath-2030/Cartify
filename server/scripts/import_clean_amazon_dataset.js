import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const cleanCsvPath = path.resolve(__dirname, '../../data/processed/amazon-products-clean.csv');

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return { fields: result, inQuotes };
}

async function runImport() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 1C: AMAZON CLEAN DATASET IMPORT TO POSTGRESQL  ');
  console.log('================================================================\n');

  if (!fs.existsSync(cleanCsvPath)) {
    throw new Error(`Clean CSV file not found: ${cleanCsvPath}`);
  }

  const client = await pool.connect();
  const startTime = Date.now();

  try {
    // 1. Pre-Import Checks
    console.log('1. Performing Pre-Import Verification Checks...');
    const catRes = await client.query('SELECT id, slug, name FROM categories ORDER BY id');
    if (catRes.rowCount < 8) {
      throw new Error(`Expected at least 8 categories, found ${catRes.rowCount}`);
    }
    const catMap = {};
    for (const r of catRes.rows) catMap[r.slug] = r.id;
    console.log(`✓ Categories verified (${catRes.rowCount} active categories).`);

    // Verify products table
    const prodCountRes = await client.query('SELECT count(*) FROM products');
    console.log(`✓ Initial Products count in database: ${prodCountRes.rows[0].count}`);

    // 2. Read Clean CSV into memory records
    console.log(`\n2. Reading and validating ${cleanCsvPath}...`);
    const fileStream = fs.createReadStream(cleanCsvPath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let header = null;
    const records = [];

    for await (const line of rl) {
      const { fields, inQuotes } = parseCsvLine(line);
      if (inQuotes) continue;

      if (!header) {
        header = fields;
        continue;
      }

      // headers: [source, source_id, name, slug, department, subcategory, brand, price, discount_percentage, final_price, rating, review_count, main_image, raw_image]
      const source = fields[0] || 'amazon';
      const sourceId = fields[1];
      const name = fields[2];
      const slug = fields[3];
      const department = fields[4];
      const subcategory = fields[5] || null;
      const brand = fields[6] || null;
      const price = parseFloat(fields[7]);
      const discountPercentage = parseFloat(fields[8]) || 0;
      const finalPrice = parseFloat(fields[9]);
      const rating = fields[10] && fields[10].trim() !== '' ? parseFloat(fields[10]) : null;
      const reviewCount = parseInt(fields[11], 10) || 0;
      const mainImage = fields[12];

      const categoryId = catMap[department];
      if (!categoryId) {
        throw new Error(`Unmapped department "${department}" found for product "${name}"`);
      }

      records.push({
        source,
        source_id: sourceId,
        name,
        slug,
        category_id: categoryId,
        subcategory,
        brand: brand || '',
        price,
        discount_percentage: discountPercentage,
        final_price: finalPrice,
        rating,
        review_count: reviewCount,
        stock_quantity: 50, // Application-level prototype inventory default
        seller_name: brand ? `${brand} Store on Amazon India` : 'Amazon Verified Seller',
        main_image: mainImage,
        images: JSON.stringify([mainImage]),
        description: `${name}${subcategory ? ` - Category: ${subcategory}.` : ''}`,
        short_description: name.length > 150 ? name.slice(0, 147) + '...' : name,
      });
    }

    console.log(`✓ Read and validated ${records.length.toLocaleString()} clean records from CSV.`);
    if (records.length !== 16904) {
      console.warn(`Note: Expected 16,904 records, read ${records.length}`);
    }

    // 3. Batch Transactional Insert
    console.log('\n3. Inserting products into PostgreSQL in high-speed batches...');
    await client.query('BEGIN');

    // Clean existing product rows inside transaction
    await client.query('DELETE FROM products');
    await client.query('ALTER SEQUENCE products_id_seq RESTART WITH 1');

    const BATCH_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const valueTuples = [];
      const params = [];

      batch.forEach((p, idx) => {
        const offset = idx * 17;
        valueTuples.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}::jsonb)`
        );
        params.push(
          p.source,
          p.source_id,
          p.name,
          p.slug,
          p.category_id,
          p.subcategory,
          p.brand,
          p.description,
          p.short_description,
          p.price,
          p.discount_percentage,
          p.final_price,
          p.rating,
          p.review_count,
          p.stock_quantity,
          p.main_image,
          p.images
        );
      });

      const sql = `
        INSERT INTO products (
          source, source_id, name, slug, category_id, subcategory,
          brand, description, short_description, price, discount_percentage,
          final_price, rating, review_count, stock_quantity, main_image, images
        )
        VALUES ${valueTuples.join(', ')}
      `;

      await client.query(sql, params);
      inserted += batch.length;
      if (inserted % 2500 === 0 || inserted === records.length) {
        console.log(`  Inserted ${inserted.toLocaleString()} / ${records.length.toLocaleString()} products...`);
      }
    }

    // 4. Generate Full-Text Search Vectors
    console.log('\n4. Generating tsvectors for full-text search...');
    await client.query(`
      UPDATE products
      SET search_vector = to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(brand, '') || ' ' || COALESCE(subcategory, ''))
    `);
    console.log('✓ Search tsvectors populated for all products.');

    await client.query('COMMIT');
    console.log('\n✓ Transaction COMMITTED successfully!');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Total Import Duration: ${duration} seconds.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import failed, transaction ROLLED BACK:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runImport().catch((err) => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
