import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
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

function parsePrice(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : 0;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

// 25 Curated World-Class Bestselling Books with high-res covers and real details
const CURATED_BOOKS = [
  {
    name: 'Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones',
    brand: 'James Clear',
    subcategory: 'Self-Help & Psychology',
    price: 799.00,
    final_price: 499.00,
    rating: 4.8,
    review_count: 85400,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=800&fit=crop',
    description: 'A revolutionary guide on how small changes lead to remarkable results. Packed with evidence-based strategies from biology, psychology, and neuroscience to make good habits inevitable and bad habits impossible.',
    specs: { Author: 'James Clear', Publisher: 'Random House Business', Language: 'English', Paperback: '320 pages' },
  },
  {
    name: 'The Psychology of Money: Timeless lessons on wealth, greed, and happiness',
    brand: 'Morgan Housel',
    subcategory: 'Finance & Investing',
    price: 499.00,
    final_price: 299.00,
    rating: 4.7,
    review_count: 52300,
    image: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=800&h=800&fit=crop',
    description: 'Doing well with money isn’t necessarily about what you know. It’s about how you behave. Morgan Housel shares 19 short stories exploring the strange ways people think about money and teaches you how to make better sense of one of life’s most important topics.',
    specs: { Author: 'Morgan Housel', Publisher: 'Harriman House', Language: 'English', Paperback: '256 pages' },
  },
  {
    name: 'Sapiens: A Brief History of Humankind',
    brand: 'Yuval Noah Harari',
    subcategory: 'History & Anthropology',
    price: 699.00,
    final_price: 449.00,
    rating: 4.7,
    review_count: 67800,
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=800&fit=crop',
    description: 'From renowned historian Yuval Noah Harari, a groundbreaking narrative of humanity’s creation and evolution that explores the ways in which biology and history have defined us and enhanced our understanding of what it means to be “human”.',
    specs: { Author: 'Yuval Noah Harari', Publisher: 'Vintage Books', Language: 'English', Paperback: '512 pages' },
  },
  {
    name: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    brand: 'Robert C. Martin',
    subcategory: 'Computer Science & Technology',
    price: 3499.00,
    final_price: 2499.00,
    rating: 4.8,
    review_count: 14200,
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&h=800&fit=crop',
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees. Master craftsman Robert C. Martin presents a revolutionary paradigm with Clean Code.',
    specs: { Author: 'Robert C. Martin', Publisher: 'Prentice Hall', Language: 'English', Paperback: '464 pages' },
  },
  {
    name: 'Deep Work: Rules for Focused Success in a Distracted World',
    brand: 'Cal Newport',
    subcategory: 'Productivity & Career',
    price: 599.00,
    final_price: 389.00,
    rating: 4.6,
    review_count: 31200,
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=800&fit=crop',
    description: 'Deep work is the ability to focus without distraction on a cognitively demanding task. It’s a skill that allows you to quickly master complicated information and produce better results in less time.',
    specs: { Author: 'Cal Newport', Publisher: 'Grand Central Publishing', Language: 'English', Paperback: '304 pages' },
  },
  {
    name: 'Rich Dad Poor Dad: What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not!',
    brand: 'Robert T. Kiyosaki',
    subcategory: 'Personal Finance',
    price: 499.00,
    final_price: 349.00,
    rating: 4.6,
    review_count: 98400,
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=800&fit=crop',
    description: 'The #1 Personal Finance book of all time. Robert Kiyosaki shares his story of growing up with two dads — his real father and the father of his best friend, his rich dad.',
    specs: { Author: 'Robert T. Kiyosaki', Publisher: 'Plata Publishing', Language: 'English', Paperback: '336 pages' },
  },
  {
    name: 'Ikigai: The Japanese Secret to a Long and Happy Life',
    brand: 'Hector Garcia',
    subcategory: 'Philosophy & Mindfulness',
    price: 550.00,
    final_price: 320.00,
    rating: 4.6,
    review_count: 46200,
    image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&h=800&fit=crop',
    description: 'Discover the Japanese secret to finding purpose, joy, and health every day. Learn from the world’s longest-living people in Okinawa on how to awaken your ikigai.',
    specs: { Author: 'Héctor García & Francesc Miralles', Publisher: 'Penguin Life', Language: 'English', Hardcover: '208 pages' },
  },
  {
    name: 'Thinking, Fast and Slow',
    brand: 'Daniel Kahneman',
    subcategory: 'Cognitive Science',
    price: 699.00,
    final_price: 459.00,
    rating: 4.6,
    review_count: 38700,
    image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=800&fit=crop',
    description: 'Nobel laureate Daniel Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think: System 1 (fast, intuitive, emotional) and System 2 (slower, deliberative, logical).',
    specs: { Author: 'Daniel Kahneman', Publisher: 'Farrar, Straus and Giroux', Language: 'English', Paperback: '512 pages' },
  },
];

async function seedBooksAndGaming() {
  console.log('Seeding curated Books and authentic Amazon Gaming products...');
  const client = await pool.connect();

  try {
    const catRes = await client.query('SELECT id, slug FROM categories');
    const catMap = {};
    for (const r of catRes.rows) catMap[r.slug] = r.id;

    const booksCatId = catMap['books'];
    const gamingCatId = catMap['gaming'];

    await client.query('BEGIN');

    // 1. Insert Curated Books
    console.log(`Inserting ${CURATED_BOOKS.length} curated bestseller books...`);
    for (const b of CURATED_BOOKS) {
      const slug = slugify(b.name);
      const discountPct = Math.round(((b.price - b.final_price) / b.price) * 100);
      await client.query(
        `INSERT INTO products (
           name, slug, description, short_description, category_id, subcategory,
           brand, price, discount_percentage, final_price, rating, review_count,
           stock_quantity, seller_name, main_image, specifications
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
         ON CONFLICT (slug) DO NOTHING`,
        [
          b.name,
          slug,
          b.description,
          b.description.slice(0, 150) + '...',
          booksCatId,
          b.subcategory,
          b.brand,
          b.price,
          discountPct,
          b.final_price,
          b.rating,
          b.review_count,
          45,
          'Cartify Book House',
          b.image,
          JSON.stringify(b.specs),
        ]
      );
    }

    // 2. Extract Gaming items from Amazon-Products.csv
    console.log('Extracting authentic Gaming products from Amazon-Products.csv...');
    const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let header = null;
    let gamingCount = 0;
    const slugCounts = {};

    for await (const line of rl) {
      const { fields, inQuotes } = parseCsvLine(line);
      if (inQuotes) continue;
      if (!header) { header = fields; continue; }

      const rawName = (fields[1] || '').trim();
      const rawImage = (fields[4] || '').trim();
      const rawRatings = fields[6];
      const rawReviewCount = fields[7];
      const rawDiscountPrice = fields[8];
      const rawActualPrice = fields[9];

      if (!rawName || rawName.length < 10 || !rawImage.includes('media-amazon.com')) continue;

      const lowerName = rawName.toLowerCase();
      const isGaming = lowerName.includes('gaming mouse') ||
        lowerName.includes('gaming keyboard') ||
        lowerName.includes('gaming headset') ||
        lowerName.includes('gaming pad') ||
        lowerName.includes('gaming controller') ||
        lowerName.includes('playstation') ||
        lowerName.includes('redgear') ||
        lowerName.includes('cosmic byte');

      if (!isGaming) continue;

      let actualPrice = parsePrice(rawActualPrice);
      let discountPrice = parsePrice(rawDiscountPrice);
      if (actualPrice === 0 && discountPrice === 0) continue;
      if (actualPrice === 0) actualPrice = Math.round(discountPrice * 1.3 * 100) / 100;
      if (discountPrice === 0) discountPrice = actualPrice;
      if (discountPrice < 150) continue;

      let brand = 'Redgear';
      if (lowerName.includes('zebronics')) brand = 'Zebronics';
      else if (lowerName.includes('logitech')) brand = 'Logitech G';
      else if (lowerName.includes('cosmic byte')) brand = 'Cosmic Byte';
      else if (lowerName.includes('razer')) brand = 'Razer';
      else if (lowerName.includes('redragon')) brand = 'Redragon';
      else if (lowerName.includes('striff')) brand = 'STRIFF';
      else if (lowerName.includes('sony') || lowerName.includes('playstation')) brand = 'PlayStation';

      let baseSlug = slugify(rawName);
      slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
      const slug = slugCounts[baseSlug] === 1 ? baseSlug : `${baseSlug}-${slugCounts[baseSlug]}`;

      const discountPct = actualPrice > discountPrice ? Math.min(90, Math.round(((actualPrice - discountPrice) / actualPrice) * 100)) : 0;
      const specs = { Brand: brand, Department: 'Gaming', Type: 'Gaming Gear & Accessories', Warranty: '1 Year Manufacturer Warranty' };

      await client.query(
        `INSERT INTO products (
           name, slug, description, short_description, category_id, subcategory,
           brand, price, discount_percentage, final_price, rating, review_count,
           stock_quantity, seller_name, main_image, specifications
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)
         ON CONFLICT (slug) DO NOTHING`,
        [
          rawName.slice(0, 200),
          slug,
          `${rawName}.\n\nAuthentic gaming equipment with high precision sensor, durable switches, and RGB illumination. Official ${brand} merchandise.`,
          `${brand} ${rawName.slice(0, 140)}... Official authentic gaming gear.`,
          gamingCatId,
          'Gaming Accessories',
          brand,
          actualPrice,
          discountPct,
          discountPrice,
          4.3,
          150,
          30,
          `${brand} Store`,
          rawImage,
          JSON.stringify(specs),
        ]
      );

      gamingCount++;
      if (gamingCount >= 300) break;
    }

    console.log(`Inserted ${gamingCount} authentic Gaming products.`);

    await client.query('COMMIT');
    console.log('✓ Committed Books and Gaming data!');

    const countRes = await client.query(
      `SELECT c.name, count(p.id) as count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.name
       ORDER BY count DESC`
    );
    console.log('\nFinal Department Counts:');
    for (const r of countRes.rows) {
      console.log(`  - ${r.name}: ${r.count} products`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding books and gaming:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedBooksAndGaming().catch(console.error);
