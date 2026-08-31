import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const dataDir = path.resolve(__dirname, '../../data');

// Department sources mapped to dedicated CSV files
const DEPARTMENT_FILES = {
  fashion: [
    { file: 'Shirts.csv', subcat: 'Shirts' },
    { file: 'T-shirts and Polos.csv', subcat: 'T-Shirts & Polos' },
    { file: 'Jeans.csv', subcat: 'Jeans' },
    { file: 'Casual Shoes.csv', subcat: 'Casual Shoes' },
    { file: 'Formal Shoes.csv', subcat: 'Formal Shoes' },
    { file: 'Sports Shoes.csv', subcat: 'Sports Shoes' },
    { file: 'Watches.csv', subcat: 'Watches' },
    { file: 'Western Wear.csv', subcat: 'Western Wear' },
    { file: 'Ethnic Wear.csv', subcat: 'Ethnic Wear' },
    { file: 'Handbags and Clutches.csv', subcat: 'Handbags' },
    { file: 'Sunglasses.csv', subcat: 'Sunglasses' },
    { file: 'Wallets.csv', subcat: 'Wallets' },
  ],
  electronics: [
    { file: 'Headphones.csv', subcat: 'Headphones & Earbuds' },
    { file: 'Speakers.csv', subcat: 'Speakers' },
    { file: 'Televisions.csv', subcat: 'Televisions' },
    { file: 'Cameras.csv', subcat: 'Cameras' },
    { file: 'Air Conditioners.csv', subcat: 'Air Conditioners' },
    { file: 'Refrigerators.csv', subcat: 'Refrigerators' },
    { file: 'Washing Machines.csv', subcat: 'Washing Machines' },
    { file: 'Kitchen and Home Appliances.csv', subcat: 'Appliances' },
  ],
  beauty: [
    { file: 'Make-up.csv', subcat: 'Makeup' },
    { file: 'Beauty and Grooming.csv', subcat: 'Grooming & Skincare' },
    { file: 'Luxury Beauty.csv', subcat: 'Luxury Beauty' },
    { file: 'Personal Care Appliances.csv', subcat: 'Personal Care' },
  ],
  sports: [
    { file: 'Cricket.csv', subcat: 'Cricket' },
    { file: 'Badminton.csv', subcat: 'Badminton' },
    { file: 'Football.csv', subcat: 'Football' },
    { file: 'Cycling.csv', subcat: 'Cycling' },
    { file: 'Fitness Accessories.csv', subcat: 'Fitness Gear' },
    { file: 'Strength Training.csv', subcat: 'Strength Training' },
    { file: 'Yoga.csv', subcat: 'Yoga' },
    { file: 'Running.csv', subcat: 'Running' },
  ],
  'home-kitchen': [
    { file: 'Furniture.csv', subcat: 'Furniture' },
    { file: 'Kitchen and Dining.csv', subcat: 'Kitchen & Dining' },
    { file: 'Home Dcor.csv', subcat: 'Home Décor' },
    { file: 'Home Furnishing.csv', subcat: 'Furnishings' },
    { file: 'Indoor Lighting.csv', subcat: 'Lighting' },
    { file: 'Bedroom Linen.csv', subcat: 'Bedroom & Bedding' },
  ],
  grocery: [
    { file: 'Coffee Tea and Beverages.csv', subcat: 'Coffee & Tea' },
    { file: 'Snack Foods.csv', subcat: 'Snacks & Confectionery' },
    { file: 'All Grocery and Gourmet Foods.csv', subcat: 'Pantry Staples' },
  ],
};

// Known popular clean brand names dictionary for high-precision extraction
const KNOWN_BRANDS = [
  'Nike', 'Adidas', 'Puma', 'Reebok', "Levi's", 'Bata', 'Campus', 'Sparx', 'Woodland',
  'Red Tape', 'Fossil', 'Titan', 'Casio', 'Ray-Ban', 'Fastrack', 'Allen Solly', 'Van Heusen',
  'Peter England', 'Louis Philippe', 'U.S. Polo Assn.', 'Crocs', 'Clarks', 'Tommy Hilfiger',
  'Dennis Lingo', 'LookMark', 'Lyriq', 'Biba', 'W for Woman', 'Vero Moda', 'Only', 'Aurelia',
  'Max', 'Pantaloons', 'Jockey', 'Zivame', 'Lymio', 'Symbol', 'Amazon Brand - Symbol',
  'Apple', 'Samsung', 'Sony', 'OnePlus', 'boAt', 'JBL', 'Philips', 'LG', 'Voltas', 'Whirlpool',
  'Lloyd', 'Carrier', 'Panasonic', 'HP', 'Dell', 'Lenovo', 'Noise', 'Fire-Boltt', 'Boult',
  'Zebronics', 'Portronics', 'Realme', 'Xiaomi', 'Mi', 'Prestige', 'Pigeon', 'Hawkins', 'Bajaj',
  'Morphy Richards', 'Kent', 'Eureka Forbes', 'Crompton', 'Havells', 'Usha', 'Orient',
  'Lakme', 'Maybelline', 'L\'Oreal', 'Colorbar', 'Swiss Beauty', 'Sugar', 'Mamaearth', 'Plum',
  'Biotique', 'Nivea', 'Dove', 'Garnier', 'The Derma Co', 'Minimalist', 'WOW Skin Science',
  'Yonex', 'Nivia', 'Cosco', 'Decathlon', 'Boldfit', 'Vector X', 'Strauss', 'Kore', 'Cultsport',
  'Tata Tea', 'Nescafe', 'BRU', 'Cadbury', 'Saffola', 'Kellogg\'s', 'Ferrero Rocher', 'Amul',
  'Dabur', 'Patanjali', 'Fortune', 'Aashirvaad', 'Dettol', 'Surf Excel', 'Ariel', 'Colgate'
];

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

function parsePrice(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : 0;
}

function parseRating(str) {
  if (!str) return 4.1;
  const num = parseFloat(str);
  return Number.isFinite(num) && num >= 1 && num <= 5 ? Math.round(num * 10) / 10 : 4.1;
}

function parseReviewCount(str) {
  if (!str) return 25;
  const cleaned = str.replace(/[, \s]/g, '');
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) && num >= 0 ? num : 25;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function extractBrand(title) {
  const cleanTitle = title.trim();
  for (const kb of KNOWN_BRANDS) {
    const regex = new RegExp(`(^|[\\s,–—\\-/])${kb.replace("'", "['’]")}([\\s,–—\\-/]|$)`, 'i');
    if (regex.test(cleanTitle)) {
      return kb;
    }
  }

  // Fallback: extract first word if valid alphanumeric
  const firstWord = cleanTitle.split(/[\s,–—\-]+/)[0] || '';
  if (firstWord.length >= 3 && firstWord.length <= 16 && /^[a-zA-Z]+$/.test(firstWord)) {
    return firstWord[0].toUpperCase() + firstWord.slice(1);
  }
  return 'Amazon Brand';
}

function isBadPlaceholderImage(url) {
  if (!url || !url.includes('media-amazon.com')) return true;
  // Amazon default placeholder hashes
  const badHashes = ['01RmB9GQpdL', '41ET8sUw-mL', 'transparent-pixel', 'no-image', 'grey-pixel'];
  return badHashes.some((bh) => url.includes(bh));
}

function buildSpecs(dept, subcat, brand) {
  const specs = {
    Brand: brand,
    Department: dept[0].toUpperCase() + dept.slice(1),
  };
  if (subcat) specs['Sub Category'] = subcat;
  if (dept === 'fashion') {
    specs['Fit Type'] = 'Regular / Slim Fit';
    specs['Material'] = 'Cotton & Premium Blends';
    specs['Care Instructions'] = 'Machine / Hand Wash';
  } else if (dept === 'electronics') {
    specs['Warranty'] = '1 Year Manufacturer Warranty';
    specs['Power Source'] = 'AC / Rechargeable Battery';
  } else if (dept === 'beauty') {
    specs['Skin Type'] = 'All Skin Types';
    specs['Item Form'] = 'Dermatologically Tested';
  } else if (dept === 'sports') {
    specs['Ideal For'] = 'Men, Women & Youths';
    specs['Sport Type'] = 'Professional & Recreation';
  } else if (dept === 'home-kitchen') {
    specs['Material'] = 'High Grade Durable Material';
    specs['Usage'] = 'Everyday Home Essentials';
  } else if (dept === 'grocery') {
    specs['Dietary Preference'] = '100% Vegetarian & Certified';
  }
  return specs;
}

async function runSeeding() {
  console.log('====================================================');
  console.log('   CARTIFY PREMIUM CURATED AMAZON SEEDER (V2)       ');
  console.log('====================================================\n');

  const client = await pool.connect();

  try {
    const catRes = await client.query('SELECT id, slug, name FROM categories');
    const catMap = {};
    for (const r of catRes.rows) catMap[r.slug] = r.id;

    const allProducts = [];
    const seenTitles = new Set();
    const slugCounts = {};

    for (const [dept, files] of Object.entries(DEPARTMENT_FILES)) {
      const categoryId = catMap[dept];
      let deptCount = 0;
      const targetPerFile = Math.ceil(2500 / files.length);

      console.log(`\nProcessing Department: [${dept.toUpperCase()}] (${files.length} sources, target ~2,500 items)...`);

      for (const { file, subcat } of files) {
        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) {
          console.warn(`  File not found: ${file} (skipped)`);
          continue;
        }

        const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        let fileCount = 0;
        let buffer = '';
        let header = null;

        for await (const line of rl) {
          buffer = buffer ? buffer + '\n' + line : line;
          const { fields, inQuotes } = parseCsvLine(buffer);
          if (inQuotes) continue;
          buffer = '';

          if (!header) {
            header = fields;
            continue;
          }

          // fields: [name, main_category, sub_category, image, link, ratings, no_of_ratings, discount_price, actual_price]
          const rawName = (fields[0] || '').trim();
          const rawImage = (fields[3] || '').trim();
          const rawRatings = fields[5];
          const rawReviewCount = fields[6];
          const rawDiscountPrice = fields[7];
          const rawActualPrice = fields[8];

          // Strict image & title validation
          if (!rawName || rawName.length < 6 || isBadPlaceholderImage(rawImage)) continue;

          // Price validation
          let actualPrice = parsePrice(rawActualPrice);
          let discountPrice = parsePrice(rawDiscountPrice);

          if (actualPrice === 0 && discountPrice === 0) continue;
          if (actualPrice === 0) actualPrice = Math.round(discountPrice * 1.25 * 100) / 100;
          if (discountPrice === 0) discountPrice = actualPrice;
          if (discountPrice > actualPrice) {
            const tmp = actualPrice;
            actualPrice = discountPrice;
            discountPrice = tmp;
          }

          if (discountPrice < 90) continue; // Skip noisy tiny trinkets

          // Deduplication
          const dedupKey = rawName.toLowerCase().slice(0, 60);
          if (seenTitles.has(dedupKey)) continue;
          seenTitles.add(dedupKey);

          const brand = extractBrand(rawName);
          const rating = parseRating(rawRatings);
          const reviewCount = parseReviewCount(rawReviewCount);
          const discountPercentage = actualPrice > discountPrice
            ? Math.min(90, Math.round(((actualPrice - discountPrice) / actualPrice) * 100))
            : 0;

          let baseSlug = slugify(rawName);
          slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
          const slug = slugCounts[baseSlug] === 1 ? baseSlug : `${baseSlug}-${slugCounts[baseSlug]}`;

          const stock = Math.floor(Math.random() * 85) + 15;
          const specifications = buildSpecs(dept, subcat, brand);
          const shortDesc = `${brand} ${rawName.slice(0, 140)}... Official authentic item.`;
          const fullDesc = `${rawName}.\n\nDepartment: ${dept.toUpperCase()} | Subcategory: ${subcat}.\nSold by ${brand} Store on Amazon India. 100% Genuine product with standard return policy.`;

          allProducts.push({
            name: rawName.slice(0, 200),
            slug,
            description: fullDesc,
            short_description: shortDesc.slice(0, 300),
            category_id: categoryId,
            subcategory: subcat,
            brand: brand.slice(0, 100),
            price: actualPrice,
            discount_percentage: discountPercentage,
            final_price: discountPrice,
            rating,
            review_count: reviewCount,
            stock_quantity: stock,
            seller_name: `${brand} Official Store`,
            main_image: rawImage,
            specifications: JSON.stringify(specifications),
          });

          fileCount++;
          deptCount++;
          if (fileCount >= targetPerFile) break;
        }

        console.log(`  - ${file}: imported ${fileCount} items (${subcat})`);
      }
      console.log(`  Total for ${dept}: ${deptCount} products`);
    }

    console.log(`\n====================================================`);
    console.log(`  Total Filtered Pristine Products: ${allProducts.length}`);
    console.log(`====================================================\n`);

    console.log('Inserting into PostgreSQL in transactions...');
    await client.query('BEGIN');
    await client.query('DELETE FROM products');

    const BATCH_SIZE = 500;
    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
      const batch = allProducts.slice(i, i + BATCH_SIZE);
      const valueTuples = [];
      const params = [];

      batch.forEach((p, idx) => {
        const offset = idx * 16;
        valueTuples.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}::jsonb)`
        );
        params.push(
          p.name,
          p.slug,
          p.description,
          p.short_description,
          p.category_id,
          p.subcategory,
          p.brand,
          p.price,
          p.discount_percentage,
          p.final_price,
          p.rating,
          p.review_count,
          p.stock_quantity,
          p.seller_name,
          p.main_image,
          p.specifications
        );
      });

      const sql = `
        INSERT INTO products (
          name, slug, description, short_description, category_id, subcategory,
          brand, price, discount_percentage, final_price, rating, review_count,
          stock_quantity, seller_name, main_image, specifications
        )
        VALUES ${valueTuples.join(', ')}
      `;

      await client.query(sql, params);
      console.log(`  Inserted ${Math.min(i + BATCH_SIZE, allProducts.length)} / ${allProducts.length} items...`);
    }

    await client.query('COMMIT');
    console.log('\n✓ Transaction COMMITTED successfully!');

    const countRes = await client.query('SELECT count(*) FROM products');
    console.log(`Final Database Product Count: ${countRes.rows[0].count}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeeding().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
