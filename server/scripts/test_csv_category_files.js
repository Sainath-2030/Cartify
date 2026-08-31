import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');

function inspectKnownCsv(filename) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filename}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').slice(0, 5);
  console.log(`\n=== ${filename} (Lines: ${content.split('\n').length}) ===`);
  lines.forEach((l, idx) => console.log(`[${idx}] ${l.slice(0, 120)}`));
}

console.log('--- Inspecting CSV Files in data/ ---');
inspectKnownCsv('Shirts.csv');
inspectKnownCsv('Casual Shoes.csv');
inspectKnownCsv('Watches.csv');
inspectKnownCsv('Headphones.csv');
inspectKnownCsv('Make-up.csv');
inspectKnownCsv('Cricket.csv');
inspectKnownCsv('Coffee Tea and Beverages.csv');
