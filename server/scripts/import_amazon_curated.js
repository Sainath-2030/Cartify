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

// Cartify 8 Top-Level Standard Categories
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

// Target quota per category to achieve a balanced ~16,000–20,000 product catalogue
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
  const firstWord = name.trim().split(/[\s,–—\-]+/)[0] || 'Cartify';
  if (firstWord.length > 2 && firstWord.length < 25 && !/^\d+$/.test(firstWord)) {
    return firstWord[0].toUpperCase() + firstWord.slice(1);
  }
  return 'Amazon Basics';
}

function buildSpecs(categorySlug, subCategory, brand) {
  const specs = {
    Brand: brand,
    Department: categorySlug[0].toUpperCase() + categorySlug.slice(1),
  };
  if (subCategory) specs['Sub Category'] = subCategory;
  if (categorySlug === 'electronics') specs['Warranty'] = '1 Year Manufacturer Warranty';
  if (categorySlug === 'fashion') specs['Material'] = 'Premium Fabric Blend';
  if (categorySlug === 'beauty') specs['Item Form'] = 'Standard';
  if (categorySlug === 'home-kitchen') specs['Usage'] = 'Indoor & Outdoor';
  if (categorySlug === 'sports') specs['Sport Type'] = 'Fitness & Recreation';
  if (categorySlug === 'grocery') specs['Diet Type'] = 'Vegetarian / Non-Vegetarian';
  return specs;
}

async function runImport() {
  console.log('====================================================');
  console.log('   CARTIFY AMAZON CURATED DATASET IMPORT PIPELINE   ');
  console.log('====================================================\n');

  console.log('1. Loading category IDs from PostgreSQL database...');
  const catRes = await pool.query('SELECT id, slug, name FROM categories');
  const catMap = {};
  for (const row of catRes.rows) {
    catMap[row.slug] = row.id;
  }
  console.log(`Found ${catRes.rows.length} existing categories:`, Object.keys(catMap));

  console.log('\n2. Streaming and parsing Amazon-Products.csv...');
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let buffer = '';
  let lineCount = 0;
  let header = null;

  const categoryCounts = {};
  const productsToInsert = [];
  const seenTitles = new Set();
  const slugCounts = {};

  for await (const line of rl) {
    lineCount++;
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

    if (!rawName || rawName.length < 5 || !rawImage.startsWith('http')) continue;

    const targetCatSlug = CATEGORY_MAP[rawMainCat];
    if (!targetCatSlug || !catMap[targetCatSlug]) continue;

    // Category quota check
    const currentCatCount = categoryCounts[targetCatSlug] || 0;
    if (currentCatCount >= TARGET_PER_CATEGORY) continue;

    // Deduplication check
    const dedupKey = rawName.toLowerCase().slice(0, 80);
    if (seenTitles.has(dedupKey)) continue;
    seenTitles.add(dedupKey);

    // Price extraction
    let actualPrice = parsePrice(rawActualPrice);
    let discountPrice = parsePrice(rawDiscountPrice);

    if (actualPrice === 0 && discountPrice === 0) continue;
    if (actualPrice === 0) actualPrice = Math.round(discountPrice * 1.25 * 100) / 100;
    if (discountPrice === 0) discountPrice = actualPrice;
    if (discountPrice > actualPrice) {
      const temp = actualPrice;
      actualPrice = discountPrice;
      discountPrice = temp;
    }

    const discountPercentage = actualPrice > discountPrice
      ? Math.min(90, Math.round(((actualPrice - discountPrice) / actualPrice) * 100))
      : 0;

    const rating = parseRating(rawRatings);
    const reviewCount = parseReviewCount(rawReviewCount);
    const brand = extractBrand(rawName);
    const categoryId = catMap[targetCatSlug];

    // Slug generation
    let baseSlug = slugify(rawName);
    slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
    const slug = slugCounts[baseSlug] === 1 ? baseSlug : `${baseSlug}-${slugCounts[baseSlug]}`;

    const stock = Math.floor(Math.random() * 85) + 15; // 15 to 100 units
    const specifications = buildSpecs(targetCatSlug, rawSubCat, brand);
    const shortDesc = `${brand} ${rawName.slice(0, 150)}... High quality item curated from Amazon Catalogue.`;
    const fullDesc = `${rawName}.\n\nCategory: ${targetCatSlug.toUpperCase()} — ${rawSubCat}.\nSold by Amazon Verified Seller. Fast shipping and 100% authentic merchandise.`;

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

    categoryCounts[targetCatSlug] = currentCatCount + 1;
  }

  console.log(`\nFiltered ${productsToInsert.length} high-quality products across categories:`);
  for (const [cat, cnt] of Object.entries(categoryCounts)) {
    console.log(`  - ${cat}: ${cnt} products`);
  }

  console.log('\n3. Inserting products into PostgreSQL in high-speed batches...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Batch insertion
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
        ON CONFLICT (slug) DO UPDATE SET
          price = EXCLUDED.price,
          final_price = EXCLUDED.final_price,
          discount_percentage = EXCLUDED.discount_percentage,
          stock_quantity = EXCLUDED.stock_quantity,
          rating = EXCLUDED.rating,
          review_count = EXCLUDED.review_count,
          updated_at = NOW()
      `;

      await client.query(sql, params);
      inserted += batch.length;
      if (inserted % 2500 === 0 || inserted === productsToInsert.length) {
        console.log(`  Inserted/Updated ${inserted} / ${productsToInsert.length} products...`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✓ Transaction COMMITTED successfully.');

    // Count total products in database
    const totalRes = await client.query('SELECT COUNT(*) FROM products');
    console.log(`\n====================================================`);
    console.log(`   TOTAL CATALOGUE SIZE IN DATABASE: ${totalRes.rows[0].count} PRODUCTS`);
    console.log(`====================================================\n`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runImport().catch((err) => {
  console.error('Error running import:', err);
  process.exit(1);
});
