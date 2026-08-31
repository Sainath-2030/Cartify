import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const csvPath = path.resolve(__dirname, '../../data/Amazon-Products.csv');

async function inspectCsv() {
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    console.log(`[Line ${lineCount}] ${line.slice(0, 150)}...`);
    if (lineCount >= 10) break;
  }
}

inspectCsv().catch(console.error);
