import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawCsvPath = path.resolve(__dirname, '../../data/Amazon-Products.csv');

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

async function findProductsInRaw() {
  const targetAsins = ['B01LP0VI3G', 'B0007OEDYS', 'B0744P71Y9', 'B072WHQFJ7', 'B003NQESIS', 'B00OLPDKB6'];
  const fileStream = fs.createReadStream(rawCsvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let header = null;
  let buffer = '';
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
    const link = fields[5] || '';
    for (const asin of targetAsins) {
      if (link.includes(asin)) {
        console.log(`\nFound ASIN [${asin}] at Raw Row ${rowIdx}:`);
        console.log(`  Name: ${fields[1]}`);
        console.log(`  Main Category: "${fields[2]}"`);
        console.log(`  Sub Category: "${fields[3]}"`);
        console.log(`  Image: ${fields[4]}`);
      }
    }
  }
}

findProductsInRaw().catch(console.error);
