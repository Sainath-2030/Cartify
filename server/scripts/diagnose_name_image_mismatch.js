import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

async function diagnose() {
  console.log('=== STEP 1: INSPECTING RAW CSV FIRST 20 PRODUCTS ===\n');
  const fileStream = fs.createReadStream(rawCsvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  let header = null;
  let buffer = '';
  const sampleProducts = [];

  for await (const line of rl) {
    lineCount++;
    buffer = buffer ? buffer + '\n' + line : line;
    const { fields, inQuotes } = parseCsvLine(buffer);
    if (inQuotes) continue;
    buffer = '';

    if (!header) {
      header = fields;
      console.log('Raw Headers:', header);
      continue;
    }

    if (sampleProducts.length < 25) {
      sampleProducts.push({
        lineNum: lineCount,
        col0_idx: fields[0],
        col1_name: fields[1],
        col2_mainCat: fields[2],
        col3_subCat: fields[3],
        col4_image: fields[4],
        col5_link: fields[5],
        col6_ratings: fields[6],
        col7_noRatings: fields[7],
        col8_discountPrice: fields[8],
        col9_actualPrice: fields[9],
      });
    } else {
      break;
    }
  }

  sampleProducts.slice(0, 10).forEach((p, idx) => {
    console.log(`\n[Product #${idx + 1}] Line ${p.lineNum}:`);
    console.log(`  Name: ${p.col1_name}`);
    console.log(`  Category: ${p.col2_mainCat} -> ${p.col3_subCat}`);
    console.log(`  Image URL: ${p.col4_image}`);
    console.log(`  Link: ${p.col5_link}`);
    console.log(`  Prices: Discount = ${p.col8_discountPrice}, Actual = ${p.col9_actualPrice}`);
  });
}

diagnose().catch(console.error);
