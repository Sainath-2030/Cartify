import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

const SALT_ROUNDS = 10;

// User Personas with primary & secondary category affinities
const PERSONA_CONFIGS = [
  { name: 'Tech & Gaming Enthusiast', primaryCat: ['Electronics', 'Gaming'], secondaryCat: ['Home & Kitchen'] },
  { name: 'Fashion & Beauty Stylist', primaryCat: ['Fashion', 'Beauty'], secondaryCat: ['Books'] },
  { name: 'Fitness & Health Seeker', primaryCat: ['Sports', 'Grocery'], secondaryCat: ['Fashion'] },
  { name: 'Home & Gourmet Chef', primaryCat: ['Home & Kitchen', 'Grocery'], secondaryCat: ['Books'] },
  { name: 'Bookworm & Knowledge Seeker', primaryCat: ['Books', 'Electronics'], secondaryCat: ['Home & Kitchen'] },
  { name: 'Lifestyle & Trend Explorer', primaryCat: ['Fashion', 'Electronics', 'Sports'], secondaryCat: ['Beauty'] },
];

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Myra', 'Ira', 'Riya', 'Pooja', 'Neha',
  'Rohan', 'Karan', 'Siddharth', 'Varun', 'Meera', 'Sneha', 'Tanvi', 'Kavya', 'Tarun', 'Nikhil'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Mehta', 'Nair', 'Iyer', 'Gupta', 'Singh', 'Chopra',
  'Deshmukh', 'Joshi', 'Bose', 'Rao', 'Kumar', 'Kapoor', 'Menon', 'Chatterjee', 'Agarwal', 'Bhat'
];

async function seedData() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting synthetic interaction dataset generation for NCF training...');

    // 1. Fetch categories
    const catRes = await client.query('SELECT id, name FROM categories');
    const categoryMap = {};
    for (const c of catRes.rows) {
      categoryMap[c.name] = c.id;
    }

    // 2. Fetch products partitioned by category
    const prodRes = await client.query(`
      SELECT id, name, category_id, brand, price 
      FROM products 
      WHERE is_active = true
      ORDER BY id ASC
    `);

    const productsByCat = {};
    for (const p of prodRes.rows) {
      if (!productsByCat[p.category_id]) {
        productsByCat[p.category_id] = [];
      }
      productsByCat[p.category_id].push(p);
    }

    console.log(`📦 Loaded ${prodRes.rows.length} active products across ${catRes.rows.length} categories.`);

    // 3. Ensure we have 35 distinct user accounts
    const existingUsers = await client.query('SELECT id, email, role FROM users ORDER BY id ASC');
    const userIds = existingUsers.rows.map(u => parseInt(u.id, 10));

    const defaultPasswordHash = await bcrypt.hash('ShopperPassword123!', SALT_ROUNDS);

    const targetUserCount = 35;
    const usersNeeded = targetUserCount - userIds.length;

    if (usersNeeded > 0) {
      console.log(`👤 Creating ${usersNeeded} synthetic shopper user profiles...`);
      for (let i = 1; i <= usersNeeded; i++) {
        const fn = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
        const ln = LAST_NAMES[(i + 3) % LAST_NAMES.length];
        const email = `shopper_${Date.now()}_${i}@cartify.com`;
        const res = await client.query(
          `INSERT INTO users (email, password_hash, full_name, role)
           VALUES ($1, $2, $3, 'USER')
           RETURNING id`,
          [email, defaultPasswordHash, `${fn} ${ln}`]
        );
        userIds.push(parseInt(res.rows[0].id, 10));
      }
    }

    console.log(`👥 Total users ready for interaction simulation: ${userIds.length}`);

    // 4. Generate realistic multi-touch interaction sessions
    // Interaction funnel: VIEW (60%) -> WISHLIST_ADD (15%) -> CART_ADD (15%) -> PURCHASE (7%) -> REVIEW/RATING (3%)
    const interactionBatch = [];
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    for (let uIdx = 0; uIdx < userIds.length; uIdx++) {
      const uid = userIds[uIdx];
      const persona = PERSONA_CONFIGS[uIdx % PERSONA_CONFIGS.length];

      // Get candidate product pools based on persona
      const primaryCatIds = persona.primaryCat.map(c => categoryMap[c]).filter(Boolean);
      const secondaryCatIds = persona.secondaryCat.map(c => categoryMap[c]).filter(Boolean);

      const preferredProducts = [];
      for (const cid of primaryCatIds) {
        if (productsByCat[cid]) {
          preferredProducts.push(...productsByCat[cid].slice(0, 40)); // top 40 items in primary cat
        }
      }

      const secondaryProducts = [];
      for (const cid of secondaryCatIds) {
        if (productsByCat[cid]) {
          secondaryProducts.push(...productsByCat[cid].slice(0, 20));
        }
      }

      // Generate 40 to 120 interaction events per user
      const eventsCount = Math.floor(Math.random() * 80) + 40;

      for (let e = 0; e < eventsCount; e++) {
        // 75% chance to pick from preferred products, 20% from secondary, 5% random discovery
        let targetProduct = null;
        const roll = Math.random();
        if (roll < 0.75 && preferredProducts.length > 0) {
          targetProduct = preferredProducts[Math.floor(Math.random() * preferredProducts.length)];
        } else if (roll < 0.95 && secondaryProducts.length > 0) {
          targetProduct = secondaryProducts[Math.floor(Math.random() * secondaryProducts.length)];
        } else {
          targetProduct = prodRes.rows[Math.floor(Math.random() * prodRes.rows.length)];
        }

        if (!targetProduct) continue;

        // Interaction funnel distribution
        const actionRoll = Math.random();
        let iType = 'VIEW';
        if (actionRoll < 0.50) iType = 'VIEW';
        else if (actionRoll < 0.65) iType = 'WISHLIST_ADD';
        else if (actionRoll < 0.85) iType = 'CART_ADD';
        else if (actionRoll < 0.95) iType = 'PURCHASE';
        else iType = 'RATING';

        // Timestamp between 30 days ago and now
        const eventTimestamp = new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));

        interactionBatch.push({
          userId: uid,
          productId: targetProduct.id,
          interactionType: iType,
          sessionId: `session_${uid}_${Math.floor(e / 5)}`,
          metadata: {
            source: 'synthetic_simulation',
            persona: persona.name,
            productCategory: targetProduct.category_id,
          },
          createdAt: eventTimestamp,
        });
      }
    }

    console.log(`⚡ Inserting ${interactionBatch.length} synthetic interaction rows into Postgres...`);

    // Insert in batches of 500
    const chunkSize = 500;
    for (let i = 0; i < interactionBatch.length; i += chunkSize) {
      const chunk = interactionBatch.slice(i, i + chunkSize);
      const values = [];
      const params = [];
      let paramIdx = 1;

      for (const row of chunk) {
        values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`);
        params.push(
          row.userId,
          row.productId,
          row.interactionType,
          row.sessionId,
          JSON.stringify(row.metadata),
          row.createdAt
        );
        paramIdx += 6;
      }

      await client.query(
        `INSERT INTO interactions (user_id, product_id, interaction_type, session_id, metadata, created_at)
         VALUES ${values.join(', ')}`,
        params
      );
    }

    const totalCountRes = await client.query('SELECT count(*) FROM interactions WHERE user_id IS NOT NULL AND product_id IS NOT NULL');
    const distinctPairsRes = await client.query('SELECT count(DISTINCT (user_id, product_id)) FROM interactions WHERE user_id IS NOT NULL AND product_id IS NOT NULL');

    console.log('✅ Interaction dataset generated successfully!');
    console.log(`📊 Total Valid Interaction Tuples in DB: ${totalCountRes.rows[0].count}`);
    console.log(`🔗 Distinct User-Item Interaction Pairs: ${distinctPairsRes.rows[0].count}`);
  } catch (err) {
    console.error('❌ Error during interaction seeding:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();
