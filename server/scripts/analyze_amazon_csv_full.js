import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, '../../data/Amazon-Products.csv');

// Robust CSV row splitter that respects quotes and escaped quotes
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

async function analyzeAmazonDataset() {
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  let rowCount = 0;
  const categories = {};
  const subcategories = {};
  let header = null;
  let buffer = '';

  for await (const line of rl) {
    lineCount++;
    buffer = buffer ? buffer + '\n' + line : line;
    const { fields, inQuotes } = parseCsvLine(buffer);
    if (inQuotes) continue; // Multi-line field, wait for closing quote

    buffer = '';
    if (!header) {
      header = fields;
      console.log('Headers:', header);
      continue;
    }

    rowCount++;
    // Headers: [ '', 'name', 'main_category', 'sub_category', 'image', 'link', 'ratings', 'no_of_ratings', 'discount_price', 'actual_price' ]
    const mainCat = (fields[2] || '').trim();
    const subCat = (fields[3] || '').trim();

    categories[mainCat] = (categories[mainCat] || 0) + 1;
    if (!subcategories[mainCat]) subcategories[mainCat] = new Set();
    subcategories[mainCat].add(subCat);

    if (rowCount <= 3) {
      console.log(`\nSample Row ${rowCount}:`);
      console.log('Name:', fields[1]);
      console.log('Main Category:', mainCat);
      console.log('Sub Category:', subCat);
      console.log('Image:', fields[4]);
      console.log('Ratings:', fields[6], 'Count:', fields[7]);
      console.log('Discount Price:', fields[8], 'Actual Price:', fields[9]);
    }
  }

  console.log(`\n=== AMAZON DATASET SUMMARY ===`);
  console.log(`Total Valid Rows: ${rowCount}`);
  console.log(`Main Categories (${Object.keys(categories).length}):`);
  for (const [cat, count] of Object.entries(categories)) {
    console.log(`  - "${cat}": ${count} products (Subcategories: ${Array.from(subcategories[cat] || []).slice(0, 5).join(', ')}...)`);
  }
}

analyzeAmazonDataset().catch(console.error);
