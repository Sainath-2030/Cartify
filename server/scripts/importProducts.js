/**
 * Cartify — Product Data Import Pipeline
 *
 * Fetches a public sample product dataset from DummyJSON
 * (https://dummyjson.com), cleans and normalizes it, converts prices to
 * INR, computes final prices, generates stable slugs and category-aware
 * specifications, and inserts the result into PostgreSQL.
 *
 * This script is a ONE-TIME DEVELOPER TOOL, run manually from your machine
 * (`node database/scripts/importProducts.js`). Cartify's frontend and API
 * never call DummyJSON directly — all product data is read from Cartify's
 * own PostgreSQL database at runtime, exactly like Section 2.
 *
 * IMPORTANT: DummyJSON is public SAMPLE data used only as a source for
 * seeding a realistic, internally-consistent academic prototype catalogue.
 * It is NOT live Amazon/Flipkart/current market data, and prices are
 * converted from its USD values using a fixed illustrative rate — not a
 * live exchange rate.
 *
 * NOTE: DummyJSON has no "gaming" or "books" categories, so this script
 * alone will populate only the 17 categories it does provide (electronics,
 * fashion, beauty, home-kitchen, grocery, sports). For the full catalogue
 * including hand-authored gaming/books items, use the pre-generated
 * database/seed_section3_real_products.sql instead (recommended — it is
 * also the version that was validated and used to test Cartify).
 *
 * Usage (from the server/ folder, where pg and dotenv are installed):
 *   node scripts/importProducts.js
 *
 * Requires DATABASE_URL to be set (reads server/.env). Safe to re-run —
 * it replaces prior product/category/review data inside a transaction
 * without touching users or interactions.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;
const USD_TO_INR = 83.0; // fixed, documented, illustrative — not a live rate

// DummyJSON categories mapped onto Cartify's existing 8 top-level
// categories (from Section 2), preserving compatibility rather than
// expanding the nav. Finer distinctions are kept via `subcategory`.
const CATEGORY_MAP = {
  smartphones: ['electronics', 'Smartphones'],
  laptops: ['electronics', 'Laptops'],
  tablets: ['electronics', 'Tablets'],
  'mobile-accessories': ['electronics', 'Audio & Accessories'],
  'mens-shirts': ['fashion', 'Men'],
  'mens-shoes': ['fashion', 'Footwear'],
  'mens-watches': ['fashion', 'Watches'],
  'womens-dresses': ['fashion', 'Women'],
  'womens-shoes': ['fashion', 'Footwear'],
  sunglasses: ['fashion', 'Accessories'],
  beauty: ['beauty', 'Makeup'],
  fragrances: ['beauty', 'Fragrance'],
  'skin-care': ['beauty', 'Skincare'],
  furniture: ['home-kitchen', 'Furniture'],
  'kitchen-accessories': ['home-kitchen', 'Kitchen'],
  groceries: ['grocery', 'Pantry'],
  'sports-accessories': ['sports', 'Fitness'],
};

const SOURCE_CATEGORIES = Object.keys(CATEGORY_MAP);

const CATEGORIES = [
  ['Electronics', 'electronics', 'Smartphones, laptops, tablets, audio and accessories.', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop'],
  ['Fashion', 'fashion', 'Clothing, footwear, watches and accessories for everyone.', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop'],
  ['Home & Kitchen', 'home-kitchen', 'Furniture and everyday kitchen essentials.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=400&fit=crop'],
  ['Books', 'books', 'Fiction, non-fiction and academic reads.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop'],
  ['Beauty', 'beauty', 'Makeup, fragrance and skincare essentials.', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=400&fit=crop'],
  ['Sports', 'sports', 'Gear and equipment for an active lifestyle.', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop'],
  ['Grocery', 'grocery', 'Everyday groceries and pantry staples.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop'],
  ['Gaming', 'gaming', 'Consoles, accessories and PC gaming gear.', 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=800&h=400&fit=crop'],
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function specsFor(categorySlug, subcategory, brand) {
  const base = { Brand: brand || 'Unbranded', Category: categorySlug[0].toUpperCase() + categorySlug.slice(1) };
  if (subcategory) base.Type = subcategory;
  if (categorySlug === 'electronics') base.Warranty = '1 Year Manufacturer Warranty';
  else if (categorySlug === 'fashion') { base.Care = 'See product label'; base['Closure Type'] = 'Standard'; }
  else if (categorySlug === 'beauty') { base['Suitable For'] = 'All Skin/Hair Types'; base['Cruelty Free'] = 'Yes'; }
  else if (categorySlug === 'home-kitchen') base.Material = 'As specified by manufacturer';
  else if (categorySlug === 'sports') base['Recommended Use'] = 'Recreational & Amateur Play';
  else if (categorySlug === 'grocery') base['Shelf Life'] = 'See packaging';
  return base;
}

async function fetchCategory(slug) {
  const res = await fetch(`https://dummyjson.com/products/category/${slug}`);
  if (!res.ok) throw new Error(`Failed to fetch category ${slug}: ${res.status}`);
  const data = await res.json();
  return data.products;
}

async function fetchAllProducts() {
  console.log(`Fetching ${SOURCE_CATEGORIES.length} categories from DummyJSON...`);
  const results = [];
  for (const slug of SOURCE_CATEGORIES) {
    try {
      const items = await fetchCategory(slug);
      console.log(`  ${slug}: ${items.length} products`);
      results.push(...items);
    } catch (err) {
      console.warn(`  ${slug}: skipped (${err.message})`);
    }
  }
  return results;
}

function transform(rawProducts) {
  const seen = new Set();
  const slugCounts = {};
  const cleaned = [];
  let duplicates = 0;

  for (const item of rawProducts) {
    const title = item.title.trim();
    const dedupKey = `${title.toLowerCase()}::${(item.brand || '').toLowerCase()}`;
    if (seen.has(dedupKey)) { duplicates += 1; continue; }
    seen.add(dedupKey);

    const [categorySlug, subcategory] = CATEGORY_MAP[item.category] || ['electronics', null];

    const priceUsd = Number(item.price);
    const discount = Math.round((item.discountPercentage || 0) * 100) / 100;
    const priceInr = Math.round(priceUsd * USD_TO_INR * 100) / 100;
    const finalPrice = Math.round((priceInr - (priceInr * discount) / 100) * 100) / 100;

    const rating = Math.round(Number(item.rating) * 100) / 100;
    const stock = Number(item.stock);
    const images = item.images && item.images.length ? item.images : [item.thumbnail];
    const mainImage = item.thumbnail || images[0];

    let baseSlug = slugify(title);
    slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
    const slug = slugCounts[baseSlug] === 1 ? baseSlug : `${baseSlug}-${slugCounts[baseSlug]}`;

    cleaned.push({
      name: title,
      slug,
      description: item.description.trim(),
      short_description: item.description.length > 140 ? item.description.slice(0, 140).trim() + '…' : item.description.trim(),
      category_slug: categorySlug,
      subcategory,
      brand: item.brand || 'Unbranded',
      price: priceInr,
      discount_percentage: discount,
      final_price: finalPrice,
      rating,
      // DummyJSON exposes individual review objects but no aggregate count.
      // Deterministic estimate from stock, not a random number — see README.
      review_count: Math.max(5, Math.round(stock * 2.5)),
      stock_quantity: stock,
      seller_name: item.brand ? `${item.brand} Official Store` : 'Cartify Retail',
      main_image: mainImage,
      images,
      specifications: specsFor(categorySlug, subcategory, item.brand),
    });
  }

  return { products: cleaned, duplicates };
}

async function importToDatabase(products) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Clears prior product/category/review data without touching users or
    // interactions (interactions.product_id cascades only for rows tied to
    // the deleted products).
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');

    for (const [name, slug, description, image] of CATEGORIES) {
      await client.query(
        'INSERT INTO categories (name, slug, description, image) VALUES ($1, $2, $3, $4)',
        [name, slug, description, image]
      );
    }

    for (const p of products) {
      await client.query(
        `INSERT INTO products (
          name, slug, description, short_description, category_id, subcategory,
          brand, price, discount_percentage, final_price, rating, review_count,
          stock_quantity, seller_name, main_image, images, specifications
        ) VALUES (
          $1, $2, $3, $4, (SELECT id FROM categories WHERE slug = $5), $6,
          $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb
        )`,
        [
          p.name, p.slug, p.description, p.short_description, p.category_slug, p.subcategory,
          p.brand, p.price, p.discount_percentage, p.final_price, p.rating, p.review_count,
          p.stock_quantity, p.seller_name, p.main_image, JSON.stringify(p.images), JSON.stringify(p.specifications),
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`Imported ${products.length} products across ${CATEGORIES.length} categories.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import failed, rolled back:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found. Make sure server/.env is configured.');
    process.exit(1);
  }

  const raw = await fetchAllProducts();
  const { products, duplicates } = transform(raw);
  console.log(`\nTransformed ${products.length} products (${duplicates} duplicates removed).`);
  console.log('NOTE: DummyJSON has no "gaming" or "books" categories, so this');
  console.log('script alone will not populate those two Cartify categories.');
  console.log('Use database/seed_section3_real_products.sql for the full,');
  console.log('pre-validated catalogue including hand-authored gaming/books items.\n');

  await importToDatabase(products);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
