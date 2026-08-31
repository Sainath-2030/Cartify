import fs from 'fs';
import readline from 'readline';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawCsvPath = path.resolve(__dirname, '../../data/Amazon-Products.csv');
const processedDir = path.resolve(__dirname, '../../data/processed');
const outputCleanCsvPath = path.join(processedDir, 'amazon-products-clean.csv');
const outputReportJsonPath = path.join(processedDir, 'preprocessing-report.json');

// 1. SPECIFIC SUB-CATEGORY CLASSIFICATION RULES
const SUB_CATEGORY_MAP = {
  // Fashion
  "men's clothing": 'fashion',
  "women's clothing": 'fashion',
  "kids' fashion": 'fashion',
  "men's shoes": 'fashion',
  "women's shoes": 'fashion',
  "casual shoes": 'fashion',
  "formal shoes": 'fashion',
  "sports shoes": 'fashion',
  "ethnic wear": 'fashion',
  "western wear": 'fashion',
  "shirts": 'fashion',
  "t-shirts & polos": 'fashion',
  "jeans": 'fashion',
  "trousers": 'fashion',
  "dresses": 'fashion',
  "tops & tees": 'fashion',
  "sarees": 'fashion',
  "kurtas & kurtis": 'fashion',
  "innerwear": 'fashion',
  "lingerie & nightwear": 'fashion',
  "swimwear": 'fashion',
  "watches": 'fashion',
  "sunglasses": 'fashion',
  "handbags & clutches": 'fashion',
  "backpacks": 'fashion',
  "wallets": 'fashion',
  "jewellery": 'fashion',
  "fashion & silver jewellery": 'fashion',
  "gold & diamond jewellery": 'fashion',
  "bags & luggage": 'fashion',
  "suitcases & trolley bags": 'fashion',

  // Electronics
  "all appliances": 'electronics',
  "air conditioners": 'electronics',
  "refrigerators": 'electronics',
  "washing machines": 'electronics',
  "microwaves": 'electronics',
  "televisions": 'electronics',
  "home entertainment systems": 'electronics',
  "headphones": 'electronics',
  "speakers": 'electronics',
  "cameras": 'electronics',
  "camera accessories": 'electronics',
  "audio & video": 'electronics',
  "smartphones": 'electronics',
  "mobile accessories": 'electronics',
  "laptops": 'electronics',
  "tablets": 'electronics',
  "wearable technology": 'electronics',
  "smartwatches": 'electronics',
  "power banks": 'electronics',
  "cables & chargers": 'electronics',
  "heating & cooling appliances": 'electronics',
  "kitchen & home appliances": 'electronics',

  // Home & Kitchen
  "kitchen & dining": 'home-kitchen',
  "cookware": 'home-kitchen',
  "small kitchen appliances": 'home-kitchen',
  "home furnishing": 'home-kitchen',
  "bedding & linen": 'home-kitchen',
  "curtains": 'home-kitchen',
  "cushions & covers": 'home-kitchen',
  "home decor": 'home-kitchen',
  "lighting": 'home-kitchen',
  "storage & organization": 'home-kitchen',
  "cleaning supplies": 'home-kitchen',
  "indoor lighting": 'home-kitchen',
  "clocks": 'home-kitchen',
  "furniture": 'home-kitchen',

  // Beauty
  "beauty & grooming": 'beauty',
  "skin care": 'beauty',
  "hair care": 'beauty',
  "bath & shower": 'beauty',
  "makeup": 'beauty',
  "fragrance": 'beauty',
  "luxury beauty": 'beauty',
  "men's grooming": 'beauty',
  "oral care": 'beauty',
  "shaving & hair removal": 'beauty',
  "personal care appliances": 'beauty',
  "health & personal care": 'beauty',

  // Sports & Fitness
  "sports & fitness": 'sports',
  "fitness & exercise": 'sports',
  "all exercise & fitness": 'sports',
  "exercise & fitness": 'sports',
  "all sports, fitness & outdoors": 'sports',
  "cardio equipment": 'sports',
  "strength training": 'sports',
  "yoga": 'sports',
  "badminton": 'sports',
  "cricket": 'sports',
  "football": 'sports',
  "swimming": 'sports',
  "cycling": 'sports',
  "camping & hiking": 'sports',
  "sports apparel": 'sports',

  // Grocery
  "grocery & gourmet foods": 'grocery',
  "coffee, tea & beverages": 'grocery',
  "snack foods": 'grocery',
  "sweets, chocolate & gum": 'grocery',
  "cooking & baking supplies": 'grocery',
  "breakfast foods": 'grocery',
  "dried fruits, nuts & seeds": 'grocery',
  "cereal & muesli": 'grocery',
  "herbs, spices & seasonings": 'grocery',
  "pasta & noodles": 'grocery',
  "oils, vinegars & salad dressings": 'grocery',
};

// 2. PURE UNCONTAMINATED MAIN CATEGORY DIRECT MAPPINGS
const PURE_MAIN_CATEGORY_MAP = {
  "men's clothing": 'fashion',
  "women's clothing": 'fashion',
  "kids' fashion": 'fashion',
  "men's shoes": 'fashion',
  "women's shoes": 'fashion',
  "bags & luggage": 'fashion',
  "fashion & silver jewellery": 'fashion',
  "appliances": 'electronics',
  "tv, audio & cameras": 'electronics',
  "beauty & health": 'beauty',
  "sports & fitness": 'sports',
  "grocery & gourmet foods": 'grocery',
};

// 3. WORD-BOUNDARY REGEX KEYWORD PATTERNS (Prevents "Teal" matching "tea" or "Honeycomb" matching "honey")
const KEYWORD_RULES = [
  // Gaming
  { dept: 'gaming', regex: /\b(gaming mouse|gaming keyboard|gaming headset|gaming pad|game controller|playstation|xbox|nintendo|redgear|cosmic byte)\b/i },
  
  // Electronics
  { dept: 'electronics', regex: /\b(smartwatch|earbuds|bluetooth speaker|inverter ac|refrigerator|washing machine|power bank|water heater|geyser|air cooler|smart tv|laptop|tablet|charger)\b/i },

  // Beauty
  { dept: 'beauty', regex: /\b(lipstick|kajal|eyeliner|mascara|foundation|sunscreen|face wash|shampoo|conditioner|perfume|eau de toilette|deodorant|serum|moisturizer|body lotion|body milk|skin cream|face cream|lip balm|hair dryer|hair straightener|diaper|diapers)\b/i },

  // Sports
  { dept: 'sports', regex: /\b(yoga mat|dumbbell|dumbbells|skipping rope|resistance band|badminton racket|cricket bat|football|shuttlecock|gym glove|exercise bike|treadmill)\b/i },

  // Home & Kitchen
  { dept: 'home-kitchen', regex: /\b(curtain|bedsheet|pillow|cushion|candle|candles|tealight|cookware|frying pan|pressure cooker|water purifier|blender|toaster|air fryer|mop|wall clock|led bulb|lamp|highlighter|notebook)\b/i },

  // Grocery (Strict whole words only)
  { dept: 'grocery', regex: /\b(green tea|black tea|filter coffee|instant coffee|coconut oil|olive oil|mustard oil|sunflower oil|dark chocolate|milk chocolate|almonds|cashews|walnuts|biscuits|cookies|potato chips|organic honey|pure honey|raw honey|pasta|noodles|muesli|corn flakes|garam masala|turmeric powder)\b/i },

  // Fashion
  { dept: 'fashion', regex: /\b(shirt|t-shirt|polo|jeans|trousers|kurta|saree|dress|shoes|sandals|clogs|heels|loafers|jacket|hoodie|blazer|handbag|backpack|wallet|wrist watch|sunglasses|necklace|earrings|bracelet|socks|boxers|briefs)\b/i },
];

function classifyByWordBoundaryKeywords(title) {
  for (const rule of KEYWORD_RULES) {
    if (rule.regex.test(title)) {
      return rule.dept;
    }
  }
  return null;
}

// 4. BALANCED-BUT-NATURAL SAMPLING CAPS
const SAMPLING_CAPS = {
  fashion: 3500,
  electronics: 3200,
  'home-kitchen': 2800,
  beauty: 2500,
  sports: 2500,
  grocery: 2200,
  gaming: 500,
  books: 100,
};

// 5. CASED AND WORD-BOUNDARY BRAND MATCHER
const BRAND_RULES = [
  { brand: 'boAt', pattern: /\bboAt\b/ },
  { brand: 'HP', pattern: /\bHP\b/ },
  { brand: 'LG', pattern: /\bLG\b/ },
  { brand: 'Mi', pattern: /\b(Mi|Xiaomi)\b/ },
  { brand: 'JBL', pattern: /\bJBL\b/ },
  { brand: 'Sony', pattern: /\bSony\b/i },
  { brand: 'Apple', pattern: /\bApple\b/i },
  { brand: 'Samsung', pattern: /\bSamsung\b/i },
  { brand: 'OnePlus', pattern: /\bOnePlus\b/i },
  { brand: 'Nike', pattern: /\bNike\b/i },
  { brand: 'Adidas', pattern: /\bAdidas\b/i },
  { brand: 'Puma', pattern: /\bPuma\b/i },
  { brand: 'Reebok', pattern: /\bReebok\b/i },
  { brand: "Levi's", pattern: /\b(Levi's|Levis)\b/i },
  { brand: 'Crocs', pattern: /\bCrocs\b/i },
  { brand: 'Bata', pattern: /\bBata\b/i },
  { brand: 'Campus', pattern: /\bCampus\b/i },
  { brand: 'Sparx', pattern: /\bSparx\b/i },
  { brand: 'Woodland', pattern: /\bWoodland\b/i },
  { brand: 'Red Tape', pattern: /\bRed\s*Tape\b/i },
  { brand: 'Allen Solly', pattern: /\bAllen\s*Solly\b/i },
  { brand: 'Van Heusen', pattern: /\bVan\s*Heusen\b/i },
  { brand: 'Peter England', pattern: /\bPeter\s*England\b/i },
  { brand: 'Louis Philippe', pattern: /\bLouis\s*Philippe\b/i },
  { brand: 'U.S. Polo Assn.', pattern: /\bU\.?S\.?\s*Polo\s*Assn\.?\b/i },
  { brand: 'Tommy Hilfiger', pattern: /\bTommy\s*Hilfiger\b/i },
  { brand: 'American Tourister', pattern: /\bAmerican\s*Tourister\b/i },
  { brand: 'Dennis Lingo', pattern: /\bDennis\s*Lingo\b/i },
  { brand: 'LookMark', pattern: /\bLookMark\b/i },
  { brand: 'Lyriq', pattern: /\bLyriq\b/i },
  { brand: 'Lymio', pattern: /\bLymio\b/i },
  { brand: 'Biba', pattern: /\bBiba\b/i },
  { brand: 'W for Woman', pattern: /\bW\s*for\s*Woman\b/i },
  { brand: 'Vero Moda', pattern: /\bVero\s*Moda\b/i },
  { brand: 'Jockey', pattern: /\bJockey\b/i },
  { brand: 'Zivame', pattern: /\bZivame\b/i },
  { brand: 'Philips', pattern: /\bPhilips\b/i },
  { brand: 'Voltas', pattern: /\bVoltas\b/i },
  { brand: 'Whirlpool', pattern: /\bWhirlpool\b/i },
  { brand: 'Lloyd', pattern: /\bLloyd\b/i },
  { brand: 'Carrier', pattern: /\bCarrier\b/i },
  { brand: 'Panasonic', pattern: /\bPanasonic\b/i },
  { brand: 'Dell', pattern: /\bDell\b/i },
  { brand: 'Lenovo', pattern: /\bLenovo\b/i },
  { brand: 'Noise', pattern: /\bNoise\b/i },
  { brand: 'Fire-Boltt', pattern: /\bFire-?Boltt\b/i },
  { brand: 'Boult', pattern: /\bBoult\b/i },
  { brand: 'Zebronics', pattern: /\bZebronics\b/i },
  { brand: 'Portronics', pattern: /\bPortronics\b/i },
  { brand: 'Realme', pattern: /\bRealme\b/i },
  { brand: 'Prestige', pattern: /\bPrestige\b/i },
  { brand: 'Pigeon', pattern: /\bPigeon\b/i },
  { brand: 'Hawkins', pattern: /\bHawkins\b/i },
  { brand: 'Bajaj', pattern: /\bBajaj\b/i },
  { brand: 'Crompton', pattern: /\bCrompton\b/i },
  { brand: 'Havells', pattern: /\bHavells\b/i },
  { brand: 'Lakme', pattern: /\bLakme\b/i },
  { brand: 'Maybelline', pattern: /\bMaybelline\b/i },
  { brand: "L'Oreal", pattern: /\b(L'Oreal|Loreal)\b/i },
  { brand: 'Nivea', pattern: /\bNivea\b/i },
  { brand: 'Dove', pattern: /\bDove\b/i },
  { brand: 'Mamaearth', pattern: /\bMamaearth\b/i },
  { brand: 'Plum', pattern: /\bPlum\b/i },
  { brand: 'Parachute', pattern: /\bParachute\b/i },
  { brand: 'Yonex', pattern: /\bYonex\b/i },
  { brand: 'Nivia', pattern: /\bNivia\b/i },
  { brand: 'Cosco', pattern: /\bCosco\b/i },
  { brand: 'Decathlon', pattern: /\bDecathlon\b/i },
  { brand: 'Boldfit', pattern: /\bBoldfit\b/i },
  { brand: 'Tata Tea', pattern: /\bTata\s*Tea\b/i },
  { brand: 'Nescafe', pattern: /\bNescafe\b/i },
  { brand: 'Cadbury', pattern: /\bCadbury\b/i },
  { brand: 'Saffola', pattern: /\bSaffola\b/i },
  { brand: 'Sunfeast', pattern: /\bSunfeast\b/i },
  { brand: 'Nespresso', pattern: /\bNespresso\b/i },
  { brand: 'Redgear', pattern: /\bRedgear\b/i },
  { brand: 'Cosmic Byte', pattern: /\bCosmic\s*Byte\b/i },
  { brand: 'Logitech', pattern: /\bLogitech\b/i },
  { brand: 'Amazon Basics', pattern: /\bAmazon\s*Basics\b/i },
  { brand: 'Solimo', pattern: /\b(Solimo|Amazon\s*Brand\s*-\s*Solimo)\b/i },
  { brand: 'STABILO', pattern: /\bSTABILO\b/i },
  { brand: 'Huggies', pattern: /\bHuggies\b/i },
  { brand: 'Nautica', pattern: /\bNautica\b/i },
];

function extractCleanBrand(title) {
  if (!title) return null;
  for (const rule of BRAND_RULES) {
    if (rule.pattern.test(title)) {
      return rule.brand;
    }
  }
  const firstWord = title.trim().split(/[\s,–—\-]+/)[0] || '';
  if (firstWord.length >= 4 && firstWord.length <= 14 && /^[A-Z][a-z]+$/.test(firstWord)) {
    const bannedWords = ['Men', 'Women', 'Unisex', 'Girls', 'Boys', 'Pack', 'Super', 'Classic', 'Regular', 'Large', 'Small', 'Extra', 'Casual', 'Formal', 'Sports', 'Digital', 'Smart', 'Pure', 'Fresh', 'High', 'Dual', 'Single', 'Combo'];
    if (!bannedWords.includes(firstWord)) {
      return firstWord;
    }
  }
  return null;
}

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
  if (!url || typeof url !== 'string') return '';
  let cleaned = url.trim();
  if (cleaned.includes('/images/W/IMAGERENDERING_')) {
    cleaned = cleaned.replace(/\/images\/W\/IMAGERENDERING_[^/]+\/images\//, '/images/');
  }
  return cleaned;
}

function isBadPlaceholderImage(url) {
  if (!url || !url.startsWith('http')) return true;
  const badHashes = ['01RmB9GQpdL', '41ET8sUw-mL', 'transparent-pixel', 'no-image', 'grey-pixel'];
  return badHashes.some((bh) => url.includes(bh));
}

function parsePrice(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[₹,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : 0;
}

function parseRating(str) {
  if (!str) return null;
  const num = parseFloat(str);
  return Number.isFinite(num) && num >= 1.0 && num <= 5.0 ? Math.round(num * 10) / 10 : null;
}

function parseReviewCount(str) {
  if (!str) return 0;
  const cleaned = str.replace(/[, \s]/g, '');
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

function calculateQualityScore(p) {
  let score = 0;
  if (p.rating !== null) score += 100;
  score += Math.min(50, (p.review_count || 0) / 10);
  if (p.brand) score += 30;
  if (p.discount_percentage > 0) score += 20;
  if (p.name.length >= 30 && p.name.length <= 140) score += 20;
  return score;
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function runPreprocessing() {
  console.log('================================================================');
  console.log('   CARTIFY REFINED AMAZON PREPROCESSING PIPELINE (ACCURATE)    ');
  console.log('================================================================\n');

  const startTime = Date.now();
  const stats = {
    originalRows: 0,
    rowsParsed: 0,
    excludedMissingName: 0,
    excludedInvalidPrice: 0,
    excludedBadImage: 0,
    excludedUnclassifiableCategory: 0,
    totalValidProductsBeforeDedup: 0,
    duplicateAsinsMerged: 0,
    uniqueAsinCount: 0,
    classificationMethodStats: {
      bySubCategory: 0,
      byPureMainCategory: 0,
      byWordBoundaryKeywords: 0,
    },
    validProductsByDepartment: {
      fashion: 0,
      electronics: 0,
      'home-kitchen': 0,
      beauty: 0,
      sports: 0,
      grocery: 0,
      gaming: 0,
      books: 0,
    },
    selectedProductsByDepartment: {
      fashion: 0,
      electronics: 0,
      'home-kitchen': 0,
      beauty: 0,
      sports: 0,
      grocery: 0,
      gaming: 0,
      books: 0,
    },
    finalProductCount: 0,
  };

  const candidateProducts = new Map();
  const fileStream = fs.createReadStream(rawCsvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let buffer = '';
  let header = null;

  console.log('Step 1: Streaming and applying multi-level hierarchical classification...');

  for await (const line of rl) {
    stats.originalRows++;
    buffer = buffer ? buffer + '\n' + line : line;
    const { fields, inQuotes } = parseCsvLine(buffer);
    if (inQuotes) continue;
    buffer = '';

    if (!header) {
      header = fields;
      continue;
    }

    stats.rowsParsed++;
    if (stats.rowsParsed % 100000 === 0) {
      console.log(`  Processed ${stats.rowsParsed.toLocaleString()} rows...`);
    }

    const rawName = (fields[1] || '').trim();
    const rawMainCat = (fields[2] || '').trim().toLowerCase();
    const rawSubCat = (fields[3] || '').trim().toLowerCase();
    const rawImage = (fields[4] || '').trim();
    const rawLink = (fields[5] || '').trim();
    const rawRatings = fields[6];
    const rawReviewCount = fields[7];
    const rawDiscountPrice = fields[8];
    const rawActualPrice = fields[9];

    if (!rawName || rawName.length < 5) {
      stats.excludedMissingName++;
      continue;
    }

    const normalizedImage = normalizeImageUrl(rawImage);
    if (!normalizedImage || isBadPlaceholderImage(normalizedImage)) {
      stats.excludedBadImage++;
      continue;
    }

    let actualPrice = parsePrice(rawActualPrice);
    let discountPrice = parsePrice(rawDiscountPrice);

    if (actualPrice === 0 && discountPrice === 0) {
      stats.excludedInvalidPrice++;
      continue;
    }
    if (actualPrice === 0) actualPrice = discountPrice;
    if (discountPrice === 0) discountPrice = actualPrice;
    if (discountPrice > actualPrice) {
      const temp = actualPrice;
      actualPrice = discountPrice;
      discountPrice = temp;
    }

    // Step 1: Check high-precision word-boundary keyword signals
    let department = classifyByWordBoundaryKeywords(rawName);
    if (department) {
      stats.classificationMethodStats.byWordBoundaryKeywords++;
    }

    // Step 2: Specific Sub-Category
    if (!department && SUB_CATEGORY_MAP[rawSubCat]) {
      department = SUB_CATEGORY_MAP[rawSubCat];
      stats.classificationMethodStats.bySubCategory++;
    }

    // Step 3: Pure Uncontaminated Main Category
    if (!department && PURE_MAIN_CATEGORY_MAP[rawMainCat]) {
      department = PURE_MAIN_CATEGORY_MAP[rawMainCat];
      stats.classificationMethodStats.byPureMainCategory++;
    }

    // Exclude unclassifiable / out-of-scope products
    if (!department) {
      stats.excludedUnclassifiableCategory++;
      continue;
    }

    const discountPercentage = actualPrice > discountPrice
      ? Math.min(90, Math.round(((actualPrice - discountPrice) / actualPrice) * 100))
      : 0;

    const rating = parseRating(rawRatings);
    const reviewCount = parseReviewCount(rawReviewCount);
    const brand = extractCleanBrand(rawName);

    let asin = extractAsin(rawLink);
    if (!asin) {
      const hash = crypto.createHash('md5').update(`${rawName}::${department}`).digest('hex').slice(0, 10).toUpperCase();
      asin = `FALLBACK-${hash}`;
    }

    const productRecord = {
      source: 'amazon',
      source_id: asin,
      name: rawName.slice(0, 255),
      department,
      subcategory: (fields[3] || '').trim().slice(0, 100),
      brand: brand || '',
      price: actualPrice.toFixed(2),
      discount_percentage: discountPercentage.toFixed(2),
      final_price: discountPrice.toFixed(2),
      rating: rating !== null ? rating.toFixed(2) : '',
      review_count: reviewCount,
      main_image: normalizedImage,
      raw_image: rawImage,
      link: rawLink,
    };

    const qualityScore = calculateQualityScore(productRecord);
    productRecord.qualityScore = qualityScore;

    stats.totalValidProductsBeforeDedup++;

    if (candidateProducts.has(asin)) {
      stats.duplicateAsinsMerged++;
      const existing = candidateProducts.get(asin);
      if (qualityScore > existing.qualityScore) {
        candidateProducts.set(asin, productRecord);
      }
    } else {
      candidateProducts.set(asin, productRecord);
    }
  }

  stats.uniqueAsinCount = candidateProducts.size;
  console.log(`\nStep 1 Complete: Validated and accurately classified ${stats.totalValidProductsBeforeDedup.toLocaleString()} records into ${candidateProducts.size.toLocaleString()} unique valid candidates.`);

  const departmentPools = {
    fashion: [],
    electronics: [],
    'home-kitchen': [],
    beauty: [],
    sports: [],
    grocery: [],
    gaming: [],
    books: [],
  };

  for (const p of candidateProducts.values()) {
    if (departmentPools[p.department]) {
      departmentPools[p.department].push(p);
      stats.validProductsByDepartment[p.department]++;
    }
  }

  console.log('\nStep 3: Applying balanced-but-natural stratified sampling...');
  const selectedProducts = [];
  const slugCounts = {};

  for (const [dept, pool] of Object.entries(departmentPools)) {
    pool.sort((a, b) => {
      if (b.qualityScore !== a.qualityScore) return b.qualityScore - a.qualityScore;
      if (b.review_count !== a.review_count) return b.review_count - a.review_count;
      return a.source_id.localeCompare(b.source_id);
    });

    const cap = SAMPLING_CAPS[dept] || 3000;
    const chosen = pool.slice(0, cap);
    stats.selectedProductsByDepartment[dept] = chosen.length;

    for (const p of chosen) {
      let baseSlug = slugify(p.name);
      slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
      p.slug = slugCounts[baseSlug] === 1 ? baseSlug : `${baseSlug}-${slugCounts[baseSlug]}`;
      selectedProducts.push(p);
    }
  }

  console.log(`\nStep 4: Writing ${selectedProducts.length.toLocaleString()} clean records to ${outputCleanCsvPath}...`);
  const csvHeaders = [
    'source',
    'source_id',
    'name',
    'slug',
    'department',
    'subcategory',
    'brand',
    'price',
    'discount_percentage',
    'final_price',
    'rating',
    'review_count',
    'main_image',
    'raw_image',
  ];

  const writeStream = fs.createWriteStream(outputCleanCsvPath, { encoding: 'utf8' });
  writeStream.write(csvHeaders.join(',') + '\n');

  for (const p of selectedProducts) {
    const row = [
      escapeCsv(p.source),
      escapeCsv(p.source_id),
      escapeCsv(p.name),
      escapeCsv(p.slug),
      escapeCsv(p.department),
      escapeCsv(p.subcategory),
      escapeCsv(p.brand),
      escapeCsv(p.price),
      escapeCsv(p.discount_percentage),
      escapeCsv(p.final_price),
      escapeCsv(p.rating),
      escapeCsv(p.review_count),
      escapeCsv(p.main_image),
      escapeCsv(p.raw_image),
    ];
    writeStream.write(row.join(',') + '\n');
  }
  writeStream.end();

  stats.finalProductCount = selectedProducts.length;
  stats.durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

  fs.writeFileSync(outputReportJsonPath, JSON.stringify(stats, null, 2), 'utf8');

  console.log('\n================================================================');
  console.log('   ACCURATE PREPROCESSING EXECUTION COMPLETED                   ');
  console.log('================================================================');
  console.log(`- Original CSV Rows: ${stats.originalRows.toLocaleString()}`);
  console.log(`- Excluded Missing/Short Names: ${stats.excludedMissingName.toLocaleString()}`);
  console.log(`- Excluded Zero/Missing Prices: ${stats.excludedInvalidPrice.toLocaleString()}`);
  console.log(`- Excluded Unclassifiable Products: ${stats.excludedUnclassifiableCategory.toLocaleString()}`);
  console.log(`- Classified by Word-Boundary Keywords: ${stats.classificationMethodStats.byWordBoundaryKeywords.toLocaleString()}`);
  console.log(`- Classified by Sub-Category: ${stats.classificationMethodStats.bySubCategory.toLocaleString()}`);
  console.log(`- Classified by Pure Main Category: ${stats.classificationMethodStats.byPureMainCategory.toLocaleString()}`);
  console.log(`- Final Clean Catalogue: ${stats.finalProductCount.toLocaleString()} products`);
  console.log(`- Duration: ${stats.durationSeconds}s\n`);

  console.log('--- CORRECTED CATEGORY DISTRIBUTION ---');
  console.log('| Department     | Total Valid Available | Final Sampled & Selected |');
  console.log('| :------------- | --------------------: | -----------------------: |');
  for (const dept of Object.keys(SAMPLING_CAPS)) {
    const avail = (stats.validProductsByDepartment[dept] || 0).toLocaleString();
    const sel = (stats.selectedProductsByDepartment[dept] || 0).toLocaleString();
    console.log(`| ${dept.padEnd(14)} | ${avail.padStart(21)} | ${sel.padStart(24)} |`);
  }
  console.log(`| **TOTAL**      | ${stats.uniqueAsinCount.toLocaleString().padStart(21)} | ${stats.finalProductCount.toLocaleString().padStart(24)} |\n`);
}

runPreprocessing().catch((err) => {
  console.error('Preprocessing failed:', err);
  process.exit(1);
});
