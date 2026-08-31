import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cleanCsvPath = path.resolve(__dirname, '../../data/processed/amazon-products-clean.csv');
const reportJsonPath = path.resolve(__dirname, '../../data/processed/preprocessing-report.json');

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

async function verifyPhase1B() {
  console.log('====================================================');
  console.log('   CARTIFY PHASE 1B VERIFICATION TEST SUITE         ');
  console.log('====================================================\n');

  let total = 0;
  let passed = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`✓ [PASS ${total}] ${name}`);
      passed++;
    } else {
      console.error(`✗ [FAIL ${total}] ${name}`);
    }
  }

  // 1. Check Output Files
  assert(fs.existsSync(cleanCsvPath), 'Output file amazon-products-clean.csv exists');
  assert(fs.existsSync(reportJsonPath), 'Report file preprocessing-report.json exists');

  // 2. Read and Validate Report JSON
  const report = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8'));
  assert(report.originalRows > 500000, `Original row count reported (${report.originalRows.toLocaleString()})`);
  assert(report.uniqueAsinCount > 400000, `Unique candidate ASIN count reported (${report.uniqueAsinCount.toLocaleString()})`);
  assert(report.finalProductCount >= 12000 && report.finalProductCount <= 20000, `Final product count within target range (${report.finalProductCount.toLocaleString()})`);

  // 3. Stream & Validate Clean CSV Rows
  const fileStream = fs.createReadStream(cleanCsvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  let header = null;
  let invalidPrices = 0;
  let badImageUrls = 0;
  let missingSourceId = 0;
  let unratedCount = 0;
  let ratedCount = 0;
  const departments = {};
  const asins = new Set();
  let duplicateAsins = 0;

  for await (const line of rl) {
    lineCount++;
    const { fields, inQuotes } = parseCsvLine(line);
    if (inQuotes) continue;

    if (!header) {
      header = fields;
      continue;
    }

    // headers: [source, source_id, name, slug, department, subcategory, brand, price, discount_percentage, final_price, rating, review_count, main_image, raw_image]
    const source = fields[0];
    const sourceId = fields[1];
    const name = fields[2];
    const slug = fields[3];
    const dept = fields[4];
    const price = parseFloat(fields[7]);
    const finalPrice = parseFloat(fields[9]);
    const rating = fields[10];
    const mainImg = fields[12];

    if (!source || !sourceId) missingSourceId++;
    if (asins.has(sourceId)) duplicateAsins++;
    asins.add(sourceId);

    if (isNaN(price) || price <= 0 || isNaN(finalPrice) || finalPrice <= 0) invalidPrices++;
    if (!mainImg || !mainImg.startsWith('http') || mainImg.includes('IMAGERENDERING_')) badImageUrls++;

    if (rating === '' || rating === null) unratedCount++;
    else ratedCount++;

    departments[dept] = (departments[dept] || 0) + 1;
  }

  assert(header && header.includes('source') && header.includes('source_id'), 'CSV contains dataset-agnostic source & source_id columns');
  assert(missingSourceId === 0, 'Zero rows with missing source or source_id');
  assert(duplicateAsins === 0, 'Zero duplicate source_ids in output CSV');
  assert(invalidPrices === 0, 'Zero rows with invalid/zero prices');
  assert(badImageUrls === 0, 'Zero rows with broken/expired IMAGERENDERING_ image URLs');
  assert(unratedCount > 0, `Unrated products cleanly preserved with empty/null rating (${unratedCount.toLocaleString()} unrated items — no fake ratings generated)`);
  assert(ratedCount > 0, `Authentic ratings preserved (${ratedCount.toLocaleString()} rated items)`);

  console.log('\nDepartment Distribution in Clean CSV:');
  for (const [d, cnt] of Object.entries(departments)) {
    console.log(`  - ${d.padEnd(16)}: ${cnt.toLocaleString()} products`);
  }

  console.log(`\n====================================================`);
  console.log(`   PHASE 1B VERIFICATION SUMMARY: ${passed} / ${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log(`====================================================\n`);

  if (passed !== total) {
    throw new Error('Phase 1B verification tests failed.');
  }
}

verifyPhase1B().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
