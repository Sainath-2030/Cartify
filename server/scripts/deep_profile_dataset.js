import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, '../../data/Amazon-Products.csv');

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

async function analyzeFullDataset() {
  console.log('--- DEEP PROFILING OF AMAZON DATASET ---');
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let totalRows = 0;
  let header = null;
  let buffer = '';

  const asins = new Set();
  const duplicateAsins = new Set();
  const seenTitles = new Set();
  let duplicateTitles = 0;

  const categories = {};
  const subcategories = {};

  let validImages = 0;
  let imageRenderingUrls = 0;
  let invalidImages = 0;

  let validActualPrices = 0;
  let validDiscountPrices = 0;
  let missingBothPrices = 0;

  let validRatings = 0;
  let missingRatings = 0;

  for await (const line of rl) {
    buffer = buffer ? buffer + '\n' + line : line;
    const { fields, inQuotes } = parseCsvLine(buffer);
    if (inQuotes) continue;
    buffer = '';

    if (!header) {
      header = fields;
      continue;
    }

    totalRows++;

    // fields: [ '', 'name', 'main_category', 'sub_category', 'image', 'link', 'ratings', 'no_of_ratings', 'discount_price', 'actual_price' ]
    const name = (fields[1] || '').trim();
    const mainCat = (fields[2] || '').trim().toLowerCase();
    const subCat = (fields[3] || '').trim();
    const image = (fields[4] || '').trim();
    const link = (fields[5] || '').trim();
    const ratings = (fields[6] || '').trim();
    const noOfRatings = (fields[7] || '').trim();
    const discountPrice = (fields[8] || '').trim();
    const actualPrice = (fields[9] || '').trim();

    // ASIN
    const asin = extractAsin(link);
    if (asin) {
      if (asins.has(asin)) duplicateAsins.add(asin);
      asins.add(asin);
    }

    // Title deduplication
    const titleKey = name.toLowerCase().slice(0, 80);
    if (seenTitles.has(titleKey)) {
      duplicateTitles++;
    } else {
      seenTitles.add(titleKey);
    }

    // Categories
    if (mainCat) {
      categories[mainCat] = (categories[mainCat] || 0) + 1;
      if (!subcategories[mainCat]) subcategories[mainCat] = {};
      if (subCat) subcategories[mainCat][subCat] = (subcategories[mainCat][subCat] || 0) + 1;
    }

    // Images
    if (image.startsWith('http')) {
      if (image.includes('IMAGERENDERING_')) {
        imageRenderingUrls++;
      }
      if (image.includes('01RmB9GQpdL') || image.includes('transparent-pixel')) {
        invalidImages++;
      } else {
        validImages++;
      }
    } else {
      invalidImages++;
    }

    // Prices
    const hasActual = actualPrice && actualPrice !== '0' && actualPrice !== '₹0';
    const hasDiscount = discountPrice && discountPrice !== '0' && discountPrice !== '₹0';
    if (hasActual) validActualPrices++;
    if (hasDiscount) validDiscountPrices++;
    if (!hasActual && !hasDiscount) missingBothPrices++;

    // Ratings
    if (ratings && !isNaN(parseFloat(ratings))) {
      validRatings++;
    } else {
      missingRatings++;
    }
  }

  console.log(`\n=== DATASET METRICS ===`);
  console.log(`Total Rows: ${totalRows}`);
  console.log(`Unique ASINs: ${asins.size}`);
  console.log(`Duplicate ASINs found: ${duplicateAsins.size}`);
  console.log(`Unique Titles (approx): ${seenTitles.size}`);
  console.log(`Duplicate Titles: ${duplicateTitles} (${((duplicateTitles / totalRows) * 100).toFixed(1)}%)`);

  console.log(`\n=== IMAGE METRICS ===`);
  console.log(`Valid Image URLs: ${validImages} (${((validImages / totalRows) * 100).toFixed(1)}%)`);
  console.log(`URLs with IMAGERENDERING_ tokens: ${imageRenderingUrls} (${((imageRenderingUrls / totalRows) * 100).toFixed(1)}%)`);
  console.log(`Invalid/Missing/Placeholder Images: ${invalidImages}`);

  console.log(`\n=== PRICE METRICS ===`);
  console.log(`Valid Actual Price (MRP): ${validActualPrices} (${((validActualPrices / totalRows) * 100).toFixed(1)}%)`);
  console.log(`Valid Discount Price (Selling): ${validDiscountPrices} (${((validDiscountPrices / totalRows) * 100).toFixed(1)}%)`);
  console.log(`Missing Both Prices: ${missingBothPrices} (${((missingBothPrices / totalRows) * 100).toFixed(2)}%)`);

  console.log(`\n=== RATING METRICS ===`);
  console.log(`Valid Ratings: ${validRatings} (${((validRatings / totalRows) * 100).toFixed(1)}%)`);
  console.log(`Missing/Unrated: ${missingRatings} (${((missingRatings / totalRows) * 100).toFixed(1)}%)`);

  console.log(`\n=== CATEGORY DISTRIBUTION (${Object.keys(categories).length} Main Categories) ===`);
  const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCats) {
    const subCount = Object.keys(subcategories[cat] || {}).length;
    console.log(`  - ${cat.padEnd(26)} : ${count.toString().padStart(6)} products (${subCount} subcategories)`);
  }
}

analyzeFullDataset().catch(console.error);
