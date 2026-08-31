import fs from 'fs';
import readline from 'readline';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const rawCsvPath = path.resolve(__dirname, '../../data/Amazon-Products.csv');
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

function extractAsin(link) {
  if (!link) return null;
  const match = link.match(/\/dp\/([A-Z0-9]{10})/i) || link.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

async function traceSampleProducts() {
  console.log('=== TRACING 20 PRODUCTS ACROSS THE ENTIRE PIPELINE ===\n');

  // 1. Pick 20 sample ASINs from diverse categories in raw CSV
  const fileStream = fs.createReadStream(rawCsvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let header = null;
  let buffer = '';
  const rawMap = new Map(); // ASIN -> raw product
  let rowIdx = 0;

  for await (const line of rl) {
    buffer = buffer ? buffer + '\n' + line : line;
    const { fields, inQuotes } = parseCsvLine(buffer);
    if (inQuotes) continue;
    buffer = '';

    if (!header) {
      header = fields;
      continue;
    }

    rowIdx++;
    // Sample across different row intervals
    if (rowIdx % 20000 === 0 && rawMap.size < 25) {
      const asin = extractAsin(fields[5]);
      if (asin) {
        rawMap.set(asin, {
          rowIdx,
          name: fields[1],
          mainCat: fields[2],
          subCat: fields[3],
          image: fields[4],
          link: fields[5],
          discountPrice: fields[8],
          actualPrice: fields[9],
        });
      }
    }
  }

  console.log(`Selected ${rawMap.size} sample products from raw CSV.`);

  // 2. Look up in clean CSV
  const cleanStream = fs.createReadStream(cleanCsvPath, { encoding: 'utf8' });
  const cleanRl = readline.createInterface({ input: cleanStream, crlfDelay: Infinity });
  let cleanHeader = null;
  const cleanMap = new Map();

  for await (const line of cleanRl) {
    const { fields, inQuotes } = parseCsvLine(line);
    if (inQuotes) continue;
    if (!cleanHeader) {
      cleanHeader = fields;
      continue;
    }
    // [source, source_id, name, slug, department, subcategory, brand, price, discount_percentage, final_price, rating, review_count, main_image, raw_image]
    const asin = fields[1];
    cleanMap.set(asin, {
      sourceId: fields[1],
      name: fields[2],
      slug: fields[3],
      department: fields[4],
      brand: fields[6],
      price: fields[7],
      finalPrice: fields[9],
      mainImage: fields[12],
    });
  }

  // 3. Look up in PostgreSQL
  const client = await pool.connect();
  const dbMap = new Map();
  try {
    const dbRes = await client.query('SELECT id, source_id, name, slug, brand, price, final_price, main_image FROM products');
    dbRes.rows.forEach(r => dbMap.set(r.source_id, r));
  } finally {
    client.release();
    await pool.end();
  }

  // 4. Compare and Output Diagnostic Matrix
  console.log('\n--- DIAGNOSTIC COMPARISON TABLE ---');
  let matchedCount = 0;
  let mismatchedCount = 0;

  let checkNum = 0;
  for (const [asin, raw] of rawMap.entries()) {
    checkNum++;
    const clean = cleanMap.get(asin);
    const db = dbMap.get(asin);

    console.log(`\n----------------------------------------------------------------`);
    console.log(`Product #${checkNum}: ASIN [${asin}] (Raw Row #${raw.rowIdx})`);
    console.log(`  [RAW CSV]`);
    console.log(`    Name : ${raw.name}`);
    console.log(`    Image: ${raw.image}`);
    console.log(`    Dept : ${raw.mainCat} -> ${raw.subCat}`);

    if (clean) {
      console.log(`  [CLEAN CSV]`);
      console.log(`    Name : ${clean.name}`);
      console.log(`    Image: ${clean.mainImage}`);
      console.log(`    Dept : ${clean.department}`);
    } else {
      console.log(`  [CLEAN CSV] Not in sampled 16,904 (Capped)`);
    }

    if (db) {
      console.log(`  [POSTGRESQL DB (ID ${db.id})]`);
      console.log(`    Name : ${db.name}`);
      console.log(`    Image: ${db.main_image}`);
    } else {
      console.log(`  [POSTGRESQL DB] Not in DB`);
    }

    // Check if clean CSV name & image match raw CSV
    if (clean) {
      const cleanImgNormalized = raw.image.replace(/\/images\/W\/IMAGERENDERING_[^/]+\/images\//, '/images/').trim();
      const isNameMatch = clean.name === raw.name.slice(0, 255);
      const isImageMatch = clean.mainImage === cleanImgNormalized;
      if (isNameMatch && isImageMatch) {
        console.log(`  >>> STATUS: PERFECT MATCH between Raw, Clean, and DB.`);
        matchedCount++;
      } else {
        console.log(`  >>> STATUS: MISMATCH! Name match: ${isNameMatch}, Image match: ${isImageMatch}`);
        mismatchedCount++;
      }
    }
  }

  console.log(`\n================================================================`);
  console.log(`Trace Summary: Matched: ${matchedCount}, Mismatched: ${mismatchedCount}`);
  console.log(`================================================================\n`);
}

traceSampleProducts().catch(console.error);
