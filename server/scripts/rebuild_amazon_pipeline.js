import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const dataDir = path.resolve(__dirname, '../../data');
const schemaPath = path.resolve(__dirname, '../../database/schema_rebuild.sql');
const amazonDumpCsv = path.resolve(__dirname, '../../data/Amazon-Products.csv');

// Standard 8 Categories with high quality headers
const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', desc: 'Smartphones, laptops, smart TVs, audio and electronics.', img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop' },
  { name: 'Fashion', slug: 'fashion', desc: 'Apparel, footwear, luxury watches and accessories.', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', desc: 'Furniture, kitchen essentials, cookware and luxury décor.', img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=400&fit=crop' },
  { name: 'Beauty', slug: 'beauty', desc: 'Makeup, grooming, skincare and luxury fragrances.', img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=400&fit=crop' },
  { name: 'Sports', slug: 'sports', desc: 'Fitness gear, cricket, badminton, yoga and active outdoor sports.', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=400&fit=crop' },
  { name: 'Grocery', slug: 'grocery', desc: 'Gourmet coffee, tea, chocolates, snacks and pantry staples.', img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop' },
  { name: 'Gaming', slug: 'gaming', desc: 'Gaming consoles, mechanical keyboards, precision mice and gear.', img: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=800&h=400&fit=crop' },
  { name: 'Books', slug: 'books', desc: 'Bestselling fiction, finance, technology and personal growth.', img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop' },
];

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

const KNOWN_BRANDS = [
  'Nike', 'Adidas', 'Puma', 'Reebok', "Levi's", 'Bata', 'Campus', 'Sparx', 'Woodland',
  'Red Tape', 'Fossil', 'Titan', 'Casio', 'Ray-Ban', 'Fastrack', 'Allen Solly', 'Van Heusen',
  'Peter England', 'Louis Philippe', 'U.S. Polo Assn.', 'Crocs', 'Clarks', 'Tommy Hilfiger',
  'Dennis Lingo', 'LookMark', 'Lyriq', 'Biba', 'W for Woman', 'Vero Moda', 'Only', 'Aurelia',
  'Max', 'Pantaloons', 'Jockey', 'Zivame', 'Lymio', 'Symbol',
  'Apple', 'Samsung', 'Sony', 'OnePlus', 'boAt', 'JBL', 'Philips', 'LG', 'Voltas', 'Whirlpool',
  'Lloyd', 'Carrier', 'Panasonic', 'HP', 'Dell', 'Lenovo', 'Noise', 'Fire-Boltt', 'Boult',
  'Zebronics', 'Portronics', 'Realme', 'Xiaomi', 'Mi', 'Prestige', 'Pigeon', 'Hawkins', 'Bajaj',
  'Morphy Richards', 'Kent', 'Eureka Forbes', 'Crompton', 'Havells', 'Usha', 'Orient',
  'Lakme', 'Maybelline', 'L\'Oreal', 'Colorbar', 'Swiss Beauty', 'Sugar', 'Mamaearth', 'Plum',
  'Biotique', 'Nivea', 'Dove', 'Garnier', 'The Derma Co', 'Minimalist', 'WOW Skin Science',
  'Yonex', 'Nivia', 'Cosco', 'Decathlon', 'Boldfit', 'Vector X', 'Strauss', 'Kore', 'Cultsport',
  'Tata Tea', 'Nescafe', 'BRU', 'Cadbury', 'Saffola', 'Kellogg\'s', 'Ferrero Rocher', 'Amul',
  'Dabur', 'Patanjali', 'Fortune', 'Aashirvaad', 'Colgate', 'PlayStation', 'Xbox', 'Logitech G',
  'Razer', 'Redgear', 'Cosmic Byte', 'Redragon', 'STRIFF'
];

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
    description: 'Doing well with money isn’t necessarily about what you know. It’s about how you behave. Morgan Housel shares 19 short stories exploring the strange ways people think about money.',
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
    description: 'From renowned historian Yuval Noah Harari, a groundbreaking narrative of humanity’s creation and evolution that explores how biology and history have defined us.',
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
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees. Master craftsman Robert C. Martin presents a revolutionary paradigm.',
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
    description: 'Deep work is the ability to focus without distraction on a cognitively demanding task. It’s a skill that allows you to quickly master complicated information.',
    specs: { Author: 'Cal Newport', Publisher: 'Grand Central Publishing', Language: 'English', Paperback: '304 pages' },
  },
  {
    name: 'Rich Dad Poor Dad: What the Rich Teach Their Kids About Money',
    brand: 'Robert T. Kiyosaki',
    subcategory: 'Personal Finance',
    price: 499.00,
    final_price: 349.00,
    rating: 4.6,
    review_count: 98400,
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=800&fit=crop',
    description: 'The #1 Personal Finance book of all time. Robert Kiyosaki shares his story of growing up with two dads and the lessons he learned about building wealth.',
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
    description: 'Nobel laureate Daniel Kahneman takes us on a groundbreaking tour of the mind, explaining System 1 (fast, emotional) and System 2 (slower, logical).',
    specs: { Author: 'Daniel Kahneman', Publisher: 'Farrar, Straus and Giroux', Language: 'English', Paperback: '512 pages' },
  },
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

function extractAsin(link) {
  if (!link) return null;
  const match = link.match(/\/dp\/([A-Z0-9]{10})/i) || link.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

function normalizeImageUrl(url) {
  if (!url) return '';
  return url.replace(/\/images\/W\/IMAGERENDERING_[^/]+\/images\//, '/images/').trim();
}

function parsePrice(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : 0;
}

function parseRating(str) {
  if (!str) return 4.2;
  const num = parseFloat(str);
  return Number.isFinite(num) && num >= 1 && num <= 5 ? Math.round(num * 10) / 10 : 4.2;
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
  const firstWord = cleanTitle.split(/[\s,–—\-]+/)[0] || '';
  if (firstWord.length >= 3 && firstWord.length <= 16 && /^[a-zA-Z]+$/.test(firstWord)) {
    return firstWord[0].toUpperCase() + firstWord.slice(1);
  }
  return 'Cartify Select';
}

function isBadPlaceholderImage(url) {
  if (!url || !url.startsWith('http')) return true;
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

async function runRebuild() {
  console.log('================================================================');
  console.log('   CARTIFY CONTROLLED REBUILD PIPELINE (DATABASE & DATASET)     ');
  console.log('================================================================\n');

  const client = await pool.connect();

  try {
    // 1. APPLY CLEAN SCHEMA
    console.log('1. Applying clean PostgreSQL rebuild schema...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('✓ Clean schema applied successfully.');

    // 2. SEED DEFAULT ACTOR USERS
    console.log('\n2. Seeding default actor accounts (Admin, Content Manager, Shopper)...');
    const saltRounds = 10;
    const adminHash = await bcrypt.hash('AdminPassword123!', saltRounds);
    const cmHash = await bcrypt.hash('ManagerPassword123!', saltRounds);
    const shopperHash = await bcrypt.hash('ShopperPassword123!', saltRounds);

    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role) VALUES
      ('admin@cartify.com', $1, 'System Administrator', 'ADMIN'),
      ('manager@cartify.com', $2, 'Lead Content Manager', 'CONTENT_MANAGER'),
      ('shopper@cartify.com', $3, 'Demo Shopper', 'USER')
    `, [adminHash, cmHash, shopperHash]);
    console.log('✓ Created Admin (admin@cartify.com), Content Manager (manager@cartify.com), Shopper (shopper@cartify.com).');

    // 3. SEED CATEGORIES
    console.log('\n3. Seeding 8 top-level standard categories...');
    const catMap = {};
    for (const c of CATEGORIES) {
      const res = await client.query(
        `INSERT INTO categories (name, slug, description, image_url) VALUES ($1, $2, $3, $4) RETURNING id`,
        [c.name, c.slug, c.desc, c.img]
      );
      catMap[c.slug] = res.rows[0].id;
    }
    console.log('✓ Categories seeded:', Object.keys(catMap));

    // 4. STRATIFIED DATASET PROCESSING & IMPORT
    console.log('\n4. Streaming and pre-processing dataset from 39 category CSV files...');
    const allProducts = [];
    const seenTitles = new Set();
    const seenAsins = new Set();
    const slugCounts = {};

    for (const [dept, files] of Object.entries(DEPARTMENT_FILES)) {
      const categoryId = catMap[dept];
      let deptCount = 0;
      const targetPerFile = Math.ceil(2500 / files.length);

      console.log(`\n  Processing department [${dept.toUpperCase()}] (${files.length} sources)...`);

      for (const { file, subcat } of files) {
        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) continue;

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
          const rawImage = normalizeImageUrl((fields[3] || '').trim());
          const rawLink = (fields[4] || '').trim();
          const rawRatings = fields[5];
          const rawReviewCount = fields[6];
          const rawDiscountPrice = fields[7];
          const rawActualPrice = fields[8];

          if (!rawName || rawName.length < 6 || isBadPlaceholderImage(rawImage)) continue;

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

          if (discountPrice < 90) continue;

          const asin = extractAsin(rawLink) || `AMZ-${dept.slice(0, 3)}-${allProducts.length + 1}`;
          if (seenAsins.has(asin)) continue;
          seenAsins.add(asin);

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
          const shortDesc = `${brand} ${rawName.slice(0, 140)}... Authentic product.`;
          const fullDesc = `${rawName}.\n\nDepartment: ${dept.toUpperCase()} | Subcategory: ${subcat}.\nSold by ${brand} Verified Store. 100% Genuine product with standard return policy.`;

          allProducts.push({
            source: 'amazon',
            source_id: asin,
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
            images: JSON.stringify([rawImage]),
            specifications: JSON.stringify(specifications),
          });

          fileCount++;
          deptCount++;
          if (fileCount >= targetPerFile) break;
        }
      }
      console.log(`    Total for ${dept}: ${deptCount} products`);
    }

    // 5. SEED BOOKS
    console.log('\n  Seeding curated Bestseller Books...');
    const booksCatId = catMap['books'];
    for (const b of CURATED_BOOKS) {
      const slug = slugify(b.name);
      const discountPct = Math.round(((b.price - b.final_price) / b.price) * 100);
      allProducts.push({
        source: 'internal',
        source_id: `BOOK-${allProducts.length + 1}`,
        name: b.name,
        slug,
        description: b.description,
        short_description: b.description.slice(0, 150) + '...',
        category_id: booksCatId,
        subcategory: b.subcategory,
        brand: b.brand,
        price: b.price,
        discount_percentage: discountPct,
        final_price: b.final_price,
        rating: b.rating,
        review_count: b.review_count,
        stock_quantity: 45,
        seller_name: 'Cartify Publishing House',
        main_image: b.image,
        images: JSON.stringify([b.image]),
        specifications: JSON.stringify(b.specs),
      });
    }

    // 6. SEED GAMING PRODUCTS
    console.log('\n  Extracting Gaming gear from Amazon dataset...');
    const gamingCatId = catMap['gaming'];
    if (fs.existsSync(amazonDumpCsv)) {
      const fileStream = fs.createReadStream(amazonDumpCsv, { encoding: 'utf8' });
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      let header = null;
      let gamingCount = 0;

      for await (const line of rl) {
        const { fields, inQuotes } = parseCsvLine(line);
        if (inQuotes) continue;
        if (!header) { header = fields; continue; }

        const rawName = (fields[1] || '').trim();
        const rawImage = normalizeImageUrl((fields[4] || '').trim());
        const rawLink = (fields[5] || '').trim();
        const rawRatings = fields[6];
        const rawReviewCount = fields[7];
        const rawDiscountPrice = fields[8];
        const rawActualPrice = fields[9];

        if (!rawName || rawName.length < 10 || isBadPlaceholderImage(rawImage)) continue;

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

        const asin = extractAsin(rawLink) || `AMZ-GAM-${allProducts.length + 1}`;
        if (seenAsins.has(asin)) continue;
        seenAsins.add(asin);

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

        allProducts.push({
          source: 'amazon',
          source_id: asin,
          name: rawName.slice(0, 200),
          slug,
          description: `${rawName}.\n\nAuthentic gaming equipment with high precision sensor and RGB lighting.`,
          short_description: `${brand} ${rawName.slice(0, 140)}... Official authentic gaming gear.`,
          category_id: gamingCatId,
          subcategory: 'Gaming Accessories',
          brand,
          price: actualPrice,
          discount_percentage: discountPct,
          final_price: discountPrice,
          rating: 4.3,
          review_count: 150,
          stock_quantity: 30,
          seller_name: `${brand} Official Store`,
          main_image: rawImage,
          images: JSON.stringify([rawImage]),
          specifications: JSON.stringify(specs),
        });

        gamingCount++;
        if (gamingCount >= 300) break;
      }
    }

    console.log(`\n================================================================`);
    console.log(`   TOTAL NORMALIZED PRODUCTS READY TO INSERT: ${allProducts.length}`);
    console.log(`================================================================\n`);

    // 7. BATCH INSERTION
    console.log('5. Inserting products into PostgreSQL in transactions...');
    await client.query('BEGIN');

    const BATCH_SIZE = 500;
    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
      const batch = allProducts.slice(i, i + BATCH_SIZE);
      const valueTuples = [];
      const params = [];

      batch.forEach((p, idx) => {
        const offset = idx * 18;
        valueTuples.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18}::jsonb)`
        );
        params.push(
          p.source,
          p.source_id,
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
          source, source_id, name, slug, description, short_description, category_id, subcategory,
          brand, price, discount_percentage, final_price, rating, review_count,
          stock_quantity, seller_name, main_image, specifications
        )
        VALUES ${valueTuples.join(', ')}
      `;

      await client.query(sql, params);
      console.log(`  Inserted ${Math.min(i + BATCH_SIZE, allProducts.length)} / ${allProducts.length} items...`);
    }

    // Generate Full-Text Search Vectors
    console.log('\n6. Generating full-text search tsvectors for all products...');
    await client.query(`
      UPDATE products
      SET search_vector = to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(brand, '') || ' ' || COALESCE(subcategory, '') || ' ' || COALESCE(description, ''))
    `);

    await client.query('COMMIT');
    console.log('\n✓ Transaction COMMITTED successfully!');

    // 8. SUMMARY
    const catBreakdown = await client.query(`
      SELECT c.name, count(p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.name
      ORDER BY count DESC
    `);
    console.log('\n================================================================');
    console.log('   REBUILD DATABASE POPULATION SUMMARY                          ');
    console.log('================================================================');
    for (const r of catBreakdown.rows) {
      console.log(`  - ${r.name.padEnd(20)}: ${r.count} products`);
    }

    const totalRes = await client.query('SELECT count(*) FROM products');
    console.log(`\n  Total Products: ${totalRes.rows[0].count}`);
    console.log('================================================================\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Rebuild failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runRebuild().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
