import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
dotenv.config({ path: envPath });

import bcrypt from 'bcrypt';
const { pool } = await import('../config/db.js');

const SALT_ROUNDS = 10;

// Diverse user personas mapped strictly to our 8 DB categories
const PERSONA_CONFIGS = [
  { name: 'Tech & Gadgets', primaryCat: ['Electronics'], secondaryCat: ['Gaming'] },
  { name: 'Fashion & Style', primaryCat: ['Fashion'], secondaryCat: ['Beauty'] },
  { name: 'Home & Living', primaryCat: ['Home & Kitchen'], secondaryCat: ['Grocery'] },
  { name: 'Beauty & Skincare', primaryCat: ['Beauty'], secondaryCat: ['Fashion'] },
  { name: 'Sports & Active', primaryCat: ['Sports'], secondaryCat: ['Electronics'] },
  { name: 'Gourmet & Daily Needs', primaryCat: ['Grocery'], secondaryCat: ['Home & Kitchen'] },
  { name: 'Hardcore Gaming', primaryCat: ['Gaming'], secondaryCat: ['Electronics'] },
  { name: 'Readers & Scholars', primaryCat: ['Books'], secondaryCat: ['Electronics'] },
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
    console.log('🚀 Starting realistic session-based interaction generation...');

    // 1. Fetch categories
    const catRes = await client.query('SELECT id, name FROM categories');
    const categoryMap = {};
    for (const c of catRes.rows) {
      categoryMap[c.name] = c.id;
    }

    // 2. Fetch active products grouped by category
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

    // 3. Ensure we have at least 50 users
    const existingUsers = await client.query('SELECT id, email, role FROM users ORDER BY id ASC');
    const userIds = existingUsers.rows.map(u => parseInt(u.id, 10));
    const defaultPasswordHash = await bcrypt.hash('ShopperPassword123!', SALT_ROUNDS);

    const targetUserCount = 50;
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

    console.log(`👥 Total users ready for session simulation: ${userIds.length}`);

    // 4. Delete existing synthetic interactions to start fresh
    console.log('🧹 Clearing previous synthetic interactions...');
    await client.query("DELETE FROM interactions WHERE metadata->>'source' = 'synthetic_simulation'");

    // 5. Generate realistic sequential shopping sessions
    const interactionBatch = [];
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    for (let uIdx = 0; uIdx < userIds.length; uIdx++) {
      const uid = userIds[uIdx];
      const persona = PERSONA_CONFIGS[uIdx % PERSONA_CONFIGS.length];

      const primaryCatIds = persona.primaryCat.map(c => categoryMap[c]).filter(Boolean);
      const secondaryCatIds = persona.secondaryCat.map(c => categoryMap[c]).filter(Boolean);

      // Generate 8 to 14 coherent shopping sessions across 30 days
      const sessionCount = Math.floor(Math.random() * 7) + 8;

      // Distribute session times chronologically
      const sessionInterval = (now - thirtyDaysAgo) / (sessionCount + 1);

      for (let s = 0; s < sessionCount; s++) {
        const sessionId = `session_${uid}_s${s}`;
        const baseSessionTime = thirtyDaysAgo + s * sessionInterval + Math.random() * (sessionInterval * 0.5);

        // 80% chance session is in primary category, 20% secondary
        const sessionCatId = (Math.random() < 0.80 && primaryCatIds.length > 0)
          ? primaryCatIds[Math.floor(Math.random() * primaryCatIds.length)]
          : (secondaryCatIds.length > 0 ? secondaryCatIds[Math.floor(Math.random() * secondaryCatIds.length)] : primaryCatIds[0]);

        const catPool = productsByCat[sessionCatId] || prodRes.rows;
        // Pick a cluster of 50 products in this category to simulate browsing a specific subdepartment
        const poolStart = Math.floor(Math.random() * Math.max(1, catPool.length - 60));
        const sessionCandidatePool = catPool.slice(poolStart, poolStart + 60);

        // Number of sequential item clicks in this session: 4 to 8
        const itemsInSession = Math.floor(Math.random() * 5) + 4;
        let currentTime = baseSessionTime;

        for (let step = 0; step < itemsInSession; step++) {
          const product = sessionCandidatePool[Math.floor(Math.random() * sessionCandidatePool.length)];
          if (!product) continue;

          // Sequential timestamp: 30s to 120s between clicks
          currentTime += Math.floor(30000 + Math.random() * 90000);

          // Funnel distribution: earlier steps are VIEW, later steps might be CART or PURCHASE
          let iType = 'VIEW';
          if (step === itemsInSession - 1) {
            const roll = Math.random();
            if (roll < 0.40) iType = 'PURCHASE';
            else if (roll < 0.75) iType = 'CART_ADD';
            else iType = 'VIEW';
          } else if (step === itemsInSession - 2 && Math.random() < 0.40) {
            iType = 'CART_ADD';
          } else if (Math.random() < 0.15) {
            iType = 'WISHLIST_ADD';
          }

          interactionBatch.push({
            userId: uid,
            productId: product.id,
            interactionType: iType,
            sessionId,
            metadata: {
              source: 'synthetic_simulation',
              persona: persona.name,
              sessionCategory: sessionCatId,
              stepIndex: step,
            },
            createdAt: new Date(currentTime),
          });
        }
      }
    }

    console.log(`⚡ Inserting ${interactionBatch.length} coherent sequential interaction rows into Postgres...`);

    // Insert in chunks of 500
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

    console.log('✅ Coherent interaction dataset generated successfully!');
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
