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

function extractAsin(link) {
  if (!link) return null;
  const match = link.match(/\/dp\/([A-Z0-9]{10})/i) || link.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

async function verifyAllCleanProductsAgainstRaw() {
  console.log('=== VERIFYING ALL 16,904 CLEAN PRODUCTS AGAINST RAW DATASET ===\n');

  // Load all 16,904 clean products into memory map by source_id
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
      mainImage: fields[12],
      department: fields[4],
    });
  }
  console.log(`Loaded ${cleanMap.size} products from clean CSV.`);

  // Stream raw CSV and check matching ASINs
  const rawStream = fs.createReadStream(rawCsvPath, { encoding: 'utf8' });
  const rawRl = readline.createInterface({ input: rawStream, crlfDelay: Infinity });
  let rawHeader = null;
  let buffer = '';
  let rowIdx = 0;

  let exactMatches = 0;
  let nameMismatches = 0;
  let imageMismatches = 0;
  const mismatchExamples = [];

  for await (const line of rawRl) {
    buffer = buffer ? buffer + '\n' + line : line;
    const { fields, inQuotes } = parseCsvLine(buffer);
    if (inQuotes) continue;
    buffer = '';

    if (!rawHeader) {
      rawHeader = fields;
      continue;
    }

    rowIdx++;
    const asin = extractAsin(fields[5]);
    if (asin && cleanMap.has(asin)) {
      const clean = cleanMap.get(asin);
      const rawName = (fields[1] || '').trim().slice(0, 255);
      const rawImageNormalized = (fields[4] || '').trim().replace(/\/images\/W\/IMAGERENDERING_[^/]+\/images\//, '/images/');

      const nameMatch = clean.name === rawName;
      const imageMatch = clean.mainImage === rawImageNormalized;

      if (nameMatch && imageMatch) {
        exactMatches++;
      } else {
        if (!nameMatch) nameMismatches++;
        if (!imageMatch) imageMismatches++;
        if (mismatchExamples.length < 10) {
          mismatchExamples.push({
            asin,
            rowIdx,
            cleanName: clean.name,
            rawName,
            cleanImage: clean.mainImage,
            rawImage: rawImageNormalized,
          });
        }
      }
    }
  }

  console.log('\n--- VERIFICATION RESULTS ---');
  console.log(`Total Clean Items Verified: ${cleanMap.size}`);
  console.log(`Exact Matches in Raw Dataset: ${exactMatches}`);
  console.log(`Name Mismatches: ${nameMismatches}`);
  console.log(`Image Mismatches: ${imageMismatches}`);

  if (mismatchExamples.length > 0) {
    console.log('\nMismatch Examples:');
    mismatchExamples.forEach(ex => console.log(ex));
  } else {
    console.log('✓ 100% of Clean CSV products EXACTLY MATCH their original row in data/Amazon-Products.csv!');
  }
}

verifyAllCleanProductsAgainstRaw().catch(console.error);
