import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, '../../data/Amazon-Products.csv');

async function profile() {
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  const categories = {};
  let header = null;

  for await (const line of rl) {
    if (!header) {
      header = line;
      continue;
    }
    count++;
    if (count % 100000 === 0) {
      console.log(`Processed ${count} rows...`);
    }
    // simple quick category extractor (handling quoted commas)
    const match = line.match(/^[^,]*,"?.*?"?,([^,]+),/);
    if (match) {
      const cat = match[1].trim().toLowerCase();
      categories[cat] = (categories[cat] || 0) + 1;
    }
  }

  console.log(`\nTotal rows: ${count}`);
  console.log('Top categories:', categories);
}

profile().catch(console.error);
