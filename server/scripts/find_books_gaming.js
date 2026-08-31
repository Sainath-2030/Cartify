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

async function findBooksAndGaming() {
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineCount = 0;
  let header = null;
  let booksFound = 0;
  let gamingFound = 0;

  for await (const line of rl) {
    lineCount++;
    const { fields, inQuotes } = parseCsvLine(line);
    if (inQuotes) continue;

    if (!header) {
      header = fields;
      continue;
    }

    const name = fields[1] || '';
    const mainCat = (fields[2] || '').toLowerCase();
    const subCat = (fields[3] || '').toLowerCase();
    const img = fields[4] || '';

    if (mainCat.includes('book') || subCat.includes('book') || mainCat.includes('kindle')) {
      booksFound++;
      if (booksFound <= 3) console.log(`[Book] ${name.slice(0, 60)} | Main: ${mainCat} | Sub: ${subCat} | Img: ${img.slice(0, 40)}`);
    }

    if (mainCat.includes('game') || subCat.includes('game') || name.toLowerCase().includes('gaming mouse') || name.toLowerCase().includes('playstation') || name.toLowerCase().includes('gaming headset')) {
      gamingFound++;
      if (gamingFound <= 3) console.log(`[Gaming] ${name.slice(0, 60)} | Main: ${mainCat} | Sub: ${subCat} | Img: ${img.slice(0, 40)}`);
    }
  }

  console.log(`\nTotal Books found in Amazon-Products.csv: ${booksFound}`);
  console.log(`Total Gaming items found in Amazon-Products.csv: ${gamingFound}`);
}

findBooksAndGaming().catch(console.error);
