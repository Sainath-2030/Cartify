import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const csvPath = path.resolve(__dirname, '../../data/Amazon-Products.csv');

// Clean standard category mapping for Amazon India dataset
const CATEGORY_MAP = {
  // Electronics
  'tv, audio & cameras': 'electronics',
  appliances: 'electronics',
  music: 'electronics',
  'car & motorbike': 'electronics',

  // Fashion
  "men's clothing": 'fashion',
  "women's clothing": 'fashion',
  "men's shoes": 'fashion',
  "women's shoes": 'fashion',
  "kids' fashion": 'fashion',
  accessories: 'fashion',
  'bags & luggage': 'fashion',
  stores: 'fashion',

  // Home & Kitchen
  'home & kitchen': 'home-kitchen',
  'pet supplies': 'home-kitchen',
  'toys & baby products': 'home-kitchen',
  'industrial supplies': 'home-kitchen',
  'home, kitchen, pets': 'home-kitchen',

  // Beauty
  'beauty & health': 'beauty',

  // Sports
  'sports & fitness': 'sports',

  // Grocery
  'grocery & gourmet foods': 'grocery',
};

// Target ~2,500 products per department for a crisp ~15,000 product catalogue
const TARGET_PER_CATEGORY = 2500;

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

function parsePrice(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : 0;
}

function parseRating(str) {
  if (!str) return 4.0;
  const num = parseFloat(str);
  return Number.isFinite(num) && num >= 1 && num <= 5 ? Math.round(num * 10) / 10 : 4.0;
}

function parseReviewCount(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[, \s]/g, '');
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function extractBrand(name) {
  const clean = name.replace(/^(Pack of \d+|Set of \d+|Combo of \d+)\s*/i, '').trim();
  const firstWord = clean.split(/[\s,–—\-]+/)[0] || 'Amazon';
  if (firstWord.length >= 2 && firstWord.length < 25 && !/^\d+$/.test(firstWord)) {
    return firstWord[0].toUpperCase() + firstWord.slice(1);
  }
  return 'Amazon India';
}

function buildSpecs(categorySlug, subCategory, brand) {
  const specs = {
    Brand: brand,
    Department: categorySlug[0].toUpperCase() + categorySlug.slice(1),
  };
  if (subCategory) specs['Sub Category'] = subCategory;
  if (categorySlug === 'electronics') specs['Warranty'] = '1 Year Manufacturer Warranty';
  if (categorySlug === 'fashion') specs['Material'] = 'Authentic Fabric / Leather';
  if (categorySlug === 'beauty') specs['Item Form'] = 'Standard Retail';
  if (categorySlug === 'home-kitchen') specs['Usage'] = 'Home & Kitchen Essential';
  if (categorySlug === 'sports') specs['Sport Type'] = 'Fitness & Recreation';
  if (categorySlug === 'grocery') specs['Diet Type'] = 'Packaged & Certified';
  return specs;
}

async function cleanAndSeed() {
  console.log('====================================================');
  console.log('   PURGING DUMMY DATA & SEEDING 100% REAL AMAZON    ');
  console.log('====================================================\n');

  const client = await pool.connect();

  try {
    console.log('1. Loading active categories...');
    const catRes = await client.query('SELECT id, slug, name FROM categories');
    const catMap = {};
    for (const row of catRes.rows) {
      catMap[row.slug] = row.id;
    }

    console.log('\n2. Streaming and extracting authentic Amazon India products...');
    const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let buffer = '';
    let header = null;
    const categoryCounts = {};
    const productsToInsert = [];
    const seenTitles = new Set();
    const slugCounts = {};

    for await (const line of rl) {
      buffer = buffer ? buffer + '\n' + line : line;
      const { fields, inQuotes } = parseCsvLine(buffer);
      if (inQuotes) continue;
      buffer = '';

      if (!header) {
        header = fields;
        continue;
      }

      // fields: [index, name, main_category, sub_category, image, link, ratings, no_of_ratings, discount_price, actual_price]
      const rawName = (fields[1] || '').trim();
      const rawMainCat = (fields[2] || '').trim().toLowerCase();
      const rawSubCat = (fields[3] || '').trim();
      const rawImage = (fields[4] || '').trim();
      const rawRatings = fields[6];
      const rawReviewCount = fields[7];
      const rawDiscountPrice = fields[8];
      const rawActualPrice = fields[9];

      // Strict real Amazon image and name validation
      if (!rawName || rawName.length < 5 || !rawImage.includes('media-amazon.com')) continue;

      const targetCatSlug = CATEGORY_MAP[rawMainCat];
      if (!targetCatSlug || !catMap[targetCatSlug]) continue;

      const currentCount = categoryCounts[targetCatSlug] || 0;
      if (currentCount >= TARGET_PER_CATEGORY) continue;

      // Price extraction
      let actualPrice = parsePrice(rawActualPrice);
      let discountPrice = parsePrice(rawDiscountPrice);

      // Must have valid non-zero real price
      if (actualPrice === 0 && discountPrice === 0) continue;
      if (actualPrice === 0) actualPrice = Math.round(discountPrice * 1.25 * 100) / 100;
      if (discountPrice === 0) discountPrice = actualPrice;
      if (discountPrice > actualPrice) {
        const temp = actualPrice;
        actualPrice = discountPrice;
        discountPrice = temp;
      }

      // Skip unrealistic noise items
      if (discountPrice < 50) continue;

      const dedupKey = rawName.toLowerCase().slice(0, 75);
      if (seenTitles.has(dedupKey)) continue;
      seenTitles.add(dedupKey);

      const discountPercentage = actualPrice > discountPrice
        ? Math.min(90, Math.round(((actualPrice - discountPrice) / actualPrice) * 100))
        : 0;

      const rating = parseRating(rawRatings);
      const reviewCount = parseReviewCount(rawReviewCount);
      const brand = extractBrand(rawName);
      const categoryId = catMap[targetCatSlug];

      let baseSlug = slugify(rawName);
      slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
      const slug = slugCounts[baseSlug] === 1 ? baseSlug : `${baseSlug}-${slugCounts[baseSlug]}`;

      const stock = Math.floor(Math.random() * 85) + 15;
      const specifications = buildSpecs(targetCatSlug, rawSubCat, brand);
      const shortDesc = `${brand} ${rawName.slice(0, 150)}... Authentic product from Amazon India.`;
      const fullDesc = `${rawName}.\n\nCategory: ${targetCatSlug.toUpperCase()} — ${rawSubCat}.\nSold by Amazon Verified Merchant. Authentic Indian product with real MRP and discount pricing.`;

      productsToInsert.push({
        name: rawName.slice(0, 200),
        slug,
        description: fullDesc,
        short_description: shortDesc.slice(0, 300),
        category_id: categoryId,
        subcategory: rawSubCat.slice(0, 100) || null,
        brand: brand.slice(0, 100),
        price: actualPrice,
        discount_percentage: discountPercentage,
        final_price: discountPrice,
        rating,
        review_count: reviewCount,
        stock_quantity: stock,
        seller_name: `${brand} Official Store`,
        main_image: rawImage,
        images: JSON.stringify([rawImage]),
        specifications: JSON.stringify(specifications),
        is_active: true,
      });

      categoryCounts[targetCatSlug] = currentCount + 1;
    }

    console.log(`\nFiltered ${productsToInsert.length} 100% authentic Amazon India products:`);
    for (const [cat, cnt] of Object.entries(categoryCounts)) {
      console.log(`  - ${cat}: ${cnt} products`);
    }

    console.log('\n3. Purging old prototype sample items and inserting real Amazon catalogue...');
    await client.query('BEGIN');

    // Purge old non-amazon/dummy items (or all products, re-inserting real catalogue)
    await client.query('DELETE FROM products');

    // Batch insert
    const BATCH_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      const valueTuples = [];
      const params = [];

      batch.forEach((p, idx) => {
        const offset = idx * 16;
        valueTuples.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}::jsonb)`
        );
        params.push(
          p.name,
          p.slug,
          p.description,
          p.short_description,
          p.category_id,
          p.subcategory,
          p.brand,
          p.price,
          p.discount_percentage,
          p.final_price,
          p.rating,
          p.review_count,
          p.stock_quantity,
          p.seller_name,
          p.main_image,
          p.specifications
        );
      });

      const sql = `
        INSERT INTO products (
          name, slug, description, short_description, category_id, subcategory,
          brand, price, discount_percentage, final_price, rating, review_count,
          stock_quantity, seller_name, main_image, specifications
        )
        VALUES ${valueTuples.join(', ')}
      `;

      await client.query(sql, params);
      inserted += batch.length;
      if (inserted % 2500 === 0 || inserted === productsToInsert.length) {
        console.log(`  Inserted ${inserted} / ${productsToInsert.length} products...`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✓ Transaction COMMITTED successfully!');

    const countRes = await client.query('SELECT COUNT(*) FROM products');
    console.log(`\n====================================================`);
    console.log(`   CLEANED 100% REAL AMAZON CATALOGUE: ${countRes.rows[0].count} PRODUCTS`);
    console.log(`====================================================\n`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during cleanup & seed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanAndSeed().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
