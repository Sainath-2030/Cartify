/**
 * Cartify — Product Data Validation Report
 *
 * Queries the live PostgreSQL database (not the source dataset) and
 * prints a data-quality report: totals, duplicate names/images, missing
 * fields, and invalid values. Run this any time after importing/reseeding
 * product data to confirm the catalogue is clean.
 *
 * Usage (from the server/ folder, where pg and dotenv are installed):
 *   node scripts/validateProducts.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found. Make sure server/.env is configured.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows: products } = await pool.query(
      'SELECT id, name, brand, main_image, price, final_price, discount_percentage, rating, stock_quantity, description, category_id FROM products'
    );
    const { rows: catCount } = await pool.query('SELECT COUNT(*) FROM categories');

    const total = products.length;
    const nameCounts = {};
    const imageCounts = {};
    for (const p of products) {
      const key = p.name.trim().toLowerCase();
      nameCounts[key] = (nameCounts[key] || 0) + 1;
      imageCounts[p.main_image] = (imageCounts[p.main_image] || 0) + 1;
    }
    const dupNames = Object.entries(nameCounts).filter(([, c]) => c > 1);
    const dupImages = Object.entries(imageCounts).filter(([, c]) => c > 1);
    const uniqueImages = Object.keys(imageCounts).length;

    const missingImages = products.filter((p) => !p.main_image);
    const missingBrands = products.filter((p) => !p.brand);
    const invalidPrices = products.filter((p) => Number(p.price) <= 0 || Number(p.final_price) > Number(p.price));
    const invalidDiscounts = products.filter((p) => Number(p.discount_percentage) < 0 || Number(p.discount_percentage) > 90);
    const invalidRatings = products.filter((p) => Number(p.rating) < 0 || Number(p.rating) > 5);
    const invalidStock = products.filter((p) => Number(p.stock_quantity) < 0);
    const missingDescriptions = products.filter((p) => !p.description || p.description.length < 20);

    console.log('PRODUCT DATA VALIDATION');
    console.log('-----------------------\n');
    console.log(`Total products: ${total}`);
    console.log(`Total categories: ${catCount[0].count}`);
    console.log(`Unique product names: ${total - dupNames.length}`);
    console.log(`Duplicate product names: ${dupNames.length}`);
    console.log(`Unique primary images: ${uniqueImages}`);
    console.log(`Duplicate primary images: ${dupImages.length}`);
    console.log(`Image uniqueness: ${((uniqueImages / total) * 100).toFixed(1)}%`);
    console.log(`Missing images: ${missingImages.length}`);
    console.log(`Missing brands: ${missingBrands.length}`);
    console.log(`Invalid prices: ${invalidPrices.length}`);
    console.log(`Invalid discounts: ${invalidDiscounts.length}`);
    console.log(`Invalid ratings: ${invalidRatings.length}`);
    console.log(`Invalid stock values: ${invalidStock.length}`);
    console.log(`Missing/too-short descriptions: ${missingDescriptions.length}`);

    if (dupImages.length) {
      console.log('\nDuplicate primary images:');
      dupImages.forEach(([img, count]) => console.log(`  ${count}x -> ${img}`));
    }
    if (missingBrands.length) {
      console.log('\nProducts with no brand (source provided none, left honestly unbranded):');
      missingBrands.forEach((p) => console.log(`  - ${p.name}`));
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
