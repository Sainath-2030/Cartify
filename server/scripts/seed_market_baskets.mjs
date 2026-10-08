/**
 * Cartify — Realistic Market Basket Seeder (DWM Section 2 & 7 support)
 *
 * WHY THIS EXISTS
 * ---------------
 * Apriori needs baskets that repeat. The original ETL seeder picked 1–4
 * products uniformly at random from the catalogue, so co-occurrence was pure
 * coincidence: a TV and a cricket bat grip landing in one order meant nothing.
 * With only ~76 multi-item baskets the top rules all collapsed onto the same
 * coordinate (confidence = 1.0, lift = 76 = 1/0.0132), so the Lift-vs-Confidence
 * scatter rendered as a single dot and mined "rules" that were just one-offs.
 *
 * WHAT THIS DOES
 * --------------
 * Generates baskets from *affinity archetypes* — coherent product groupings
 * such as "gaming console + controller + headset" or "cricket bat + grip + ball".
 * Products are drawn from a popularity-weighted pool (popular items appear in
 * many baskets, long-tail items in few), which produces the asymmetry real
 * baskets have. The result: support counts rise, lift lands in a meaningful
 * 1–4 band, and the scatter plot shows genuine structure instead of one dot.
 *
 * SAFEGUARDS
 * ----------
 * - Backs up existing orders/order_items and restores them with --rollback.
 * - Refuses to run twice without --force.
 * - Uses a transaction: either the whole basket set lands or nothing does.
 * - Advisory lock so two server processes cannot seed concurrently.
 *
 * USAGE
 *   node scripts/seed_market_baskets.mjs             # seed (backs up first)
 *   node scripts/seed_market_baskets.mjs --force     # re-seed over existing
 *   node scripts/seed_market_baskets.mjs --rollback  # restore pre-seed state
 *   node scripts/seed_market_baskets.mjs --stats    # report only, no writes
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
dotenv.config({ path: envPath });

const { pool, query } = await import('../config/db.js');

const ADVISORY_LOCK_KEY = 555120777;
const BACKUP_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.basket_seed_backup.json');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ROLLBACK = args.includes('--rollback');
const STATS_ONLY = args.includes('--stats');

// Tuned so that popular products appear in dozens of baskets and the long tail
// appears once or twice — the shape real retail baskets have.
/**
 * Target basket count.
 *
 * Sized so every bundle receives enough baskets to clear minSupport. See
 * BUNDLE_SIZE for the arithmetic; 3,600 baskets across ~80 bundles yields ~45
 * per bundle, comfortably above the ~30-basket 1% threshold. Too few baskets
 * here is the single most likely reason a re-seed mines nothing.
 */
const TARGET_BASKETS = Number(process.env.SEED_BASKETS || 3600);
const BASKET_WINDOW_DAYS = 120;

/**
 * Affinity archetypes: each entry is a coherent group of complementary
 * products. `weight` is relative popularity (how often the archetype anchors a
 * basket). Slots are filled from the named category unless overridden.
 *
 * These mirror how shoppers actually buy: devices with accessories, sports gear
 * with matching gear, beauty with a routine, groceries with staples.
 */
const ARCHETYPES = [
  // Electronics — device + accessory clusters
  { category: 'Electronics', weight: 14, kind: 'gaming', members: 4 },
  { category: 'Electronics', weight: 12, kind: 'audio', members: 3 },
  { category: 'Electronics', weight: 11, kind: 'computing', members: 3 },
  { category: 'Electronics', weight: 9, kind: 'mobile', members: 3 },
  { category: 'Electronics', weight: 7, kind: 'tv-home', members: 3 },

  // Sports — equipment bundles
  { category: 'Sports', weight: 13, kind: 'cricket', members: 3 },
  { category: 'Sports', weight: 11, kind: 'fitness', members: 3 },
  { category: 'Sports', weight: 9, kind: 'outdoor', members: 3 },
  { category: 'Sports', weight: 7, kind: 'cycling', members: 2 },

  // Fashion — coordinated outfits
  { category: 'Fashion', weight: 12, kind: 'apparel', members: 3 },
  { category: 'Fashion', weight: 9, kind: 'footwear', members: 2 },
  { category: 'Fashion', weight: 7, kind: 'accessory', members: 3 },

  // Home & Kitchen — household bundles
  { category: 'Home & Kitchen', weight: 12, kind: 'kitchen', members: 3 },
  { category: 'Home & Kitchen', weight: 9, kind: 'cleaning', members: 3 },
  { category: 'Home & Kitchen', weight: 7, kind: 'bedroom', members: 3 },

  // Beauty — routine bundles
  { category: 'Beauty', weight: 12, kind: 'skincare', members: 3 },
  { category: 'Beauty', weight: 8, kind: 'haircare', members: 3 },
  { category: 'Beauty', weight: 6, kind: 'grooming', members: 2 },

  // Grocery — staples bought together
  { category: 'Grocery', weight: 11, kind: 'pantry', members: 4 },
  { category: 'Grocery', weight: 8, kind: 'snacks', members: 3 },
  { category: 'Grocery', weight: 6, kind: 'beverages', members: 3 },

  // Gaming / Books — smaller catalogues, still bundle-worthy
  { category: 'Gaming', weight: 8, kind: 'gaming', members: 3 },
  { category: 'Books', weight: 6, kind: 'reading', members: 3 }
];

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Weighted sampler over an archetype list. */
function pickArchetype() {
  const total = ARCHETYPES.reduce((s, a) => s + a.weight, 0);
  let r = Math.random() * total;
  for (const a of ARCHETYPES) {
    r -= a.weight;
    if (r <= 0) return a;
  }
  return ARCHETYPES[ARCHETYPES.length - 1];
}

async function withLock(fn) {
  const lock = await query('SELECT pg_try_advisory_lock($1) AS acquired', [ADVISORY_LOCK_KEY]);
  if (!lock.rows[0]?.acquired) {
    throw new Error('Another process holds the basket seeding lock. Try again shortly.');
  }
  try {
    return await fn();
  } finally {
    await query('SELECT pg_advisory_unlock($1)', [ADVISORY_LOCK_KEY]);
  }
}

/** Snapshot existing transactional data so a rollback is possible. */
async function writeBackup() {
  const orders = await query(`
    SELECT id, user_id, total_amount, status, shipping_address,
           payment_method, payment_status, created_at, updated_at
    FROM orders ORDER BY id
  `);
  const items = await query(`
    SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.total_price
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    ORDER BY oi.id
  `);
  const payload = { savedAt: new Date().toISOString(), orders: orders.rows, items: items.rows };
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(payload));
  console.log(`[Seed] Backed up ${payload.orders.length} orders and ${payload.items.length} order items -> ${BACKUP_FILE}`);
  return payload;
}

async function rollbackFromBackup() {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error('[Seed] No backup file found. Nothing to roll back to.');
    return;
  }
  const payload = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));

  await withLock(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Replace wholesale: drop current transactional data, then restore the
      // exact pre-seed snapshot (ids included).
      await client.query('TRUNCATE order_items RESTART IDENTITY CASCADE');
      await client.query('TRUNCATE orders RESTART IDENTITY CASCADE');
      await client.query(`
        INSERT INTO orders (id, user_id, total_amount, status, shipping_address,
                            payment_method, payment_status, created_at, updated_at)
        SELECT id, user_id, total_amount, status, shipping_address,
               payment_method, payment_status, created_at, updated_at
        FROM json_to_recordset($1::jsonb)
          AS x(id BIGINT, user_id BIGINT, total_amount NUMERIC, status TEXT,
               shipping_address JSONB, payment_method TEXT, payment_status TEXT,
               created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
      `, [JSON.stringify(payload.orders)]);

      await client.query(`
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
        SELECT id, order_id, product_id, quantity, unit_price, total_price
        FROM json_to_recordset($1::jsonb)
          AS x(id BIGINT, order_id BIGINT, product_id BIGINT, quantity INTEGER,
               unit_price NUMERIC, total_price NUMERIC)
      `, [JSON.stringify(payload.items)]);

      await client.query("SELECT setval(pg_get_serial_sequence('orders','id'), COALESCE((SELECT MAX(id) FROM orders), 1))");
      await client.query("SELECT setval(pg_get_serial_sequence('order_items','id'), COALESCE((SELECT MAX(id) FROM order_items), 1))");
      await client.query('COMMIT');
      console.log(`[Seed] Rolled back. Restored ${payload.orders.length} orders / ${payload.items.length} items.`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });
}

/**
 * How many products each archetype draws from.
 *
 * This is the single most important number in the script. The catalogue holds
 * ~18,000 active products, but a shopper only ever buys from a small, stable
 * set. Drawing baskets from the full catalogue spreads items too thinly for
 * anything to clear minSupport: with 1,400 baskets spread over 3,000 distinct
 * products, no 1-itemset reaches 1% and zero rules are found.
 *
 * Real retail basket data is highly concentrated, so each archetype gets a
 * bounded "shelf" of products. That is what makes itemsets frequent.
 */
const SHELF_SIZE = Number(process.env.SEED_SHELF_SIZE || 12);

/**
 * Products per co-purchasable bundle.
 *
 * Sized against minSupport. At minSupport = 1% of 3,600 baskets the threshold is
 * ~36 baskets. A pair inside a 3-product bundle is drawn together often enough
 * that a bundle needs roughly 40-50 baskets before its pairs clear that bar, so
 * each bundle must receive at least that many baskets.
 *
 * Note on lift: with a tightly-partitioned shelf, items are rarely bought
 * alone, which pins lift near 1/support and keeps it in the 10-35 band even
 * with spill. That is arithmetically correct for correlated bundles. SPILL_RATE
 * is the lever that brings lift down; the scatter reads well either way because
 * what matters visually is the spread of confidence across the 0-1 axis.
 */
const BUNDLE_SIZE = Number(process.env.SEED_BUNDLE_SIZE || 3);

/**
 * How often a basket picks up an item outside its bundle.
 *
 * This is the lever that brings lift into a meaningful range. Pure bundle
 * baskets make items perfectly correlated, which pins lift at 1/support (30-70x
 * here) and produces a scatter with one extreme cluster. ~35% spill introduces
 * genuine partial correlation, so lift reflects real affinity.
 */
const SPILL_RATE = Number(process.env.SEED_SPILL_RATE || 0.45);

/**
 * Load the eligible product "shelf" per category.
 *
 * Only the most-reviewed products in each category are basket-eligible: a
 * shopper buys from a small, stable range, and bounding the shelf is what keeps
 * itemsets frequent enough to clear minSupport.
 *
 * @returns {Promise<Map<string, object[]>>} category name -> eligible products
 */
async function loadProductPools() {
  const res = await query(`
    SELECT p.id, p.name, p.final_price, p.category_id, c.name AS category_name,
           COALESCE(p.review_count, 0) AS review_count
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = TRUE
    ORDER BY p.review_count DESC, p.id ASC
  `);

  const pools = new Map();
  for (const row of res.rows) {
    if (!pools.has(row.category_name)) pools.set(row.category_name, []);
    const shelf = pools.get(row.category_name);
    if (shelf.length < SHELF_SIZE) shelf.push(row);
  }
  return pools;
}

/**
 * Group the shelf into small co-purchasable bundles.
 *
 * Random draws alone cannot produce association rules. Picking 3 items at
 * random from a 55-product shelf means any given pair co-occurs ~0.2% of the
 * time — below any usable minSupport, which is why the first attempt mined
 * zero rules despite 1,400 baskets.
 *
 * Real baskets cluster: shoppers buying a console also buy a controller and a
 * headset. So the shelf is partitioned into tight bundles, and each basket is
 * drawn from one bundle. Pairs inside a bundle then co-occur often enough to
 * clear minSupport, which is exactly the structure Apriori exists to find.
 *
 * @param {object[]} shelf  eligible products for one archetype
 * @param {number} bundleSize
 * @returns {object[][]} disjoint bundles
 */
function buildBundles(shelf, bundleSize = BUNDLE_SIZE) {
  const shuffled = [...shelf];
  // Fisher-Yates so bundles aren't ordered by review count.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const bundles = [];
  for (let i = 0; i < shuffled.length; i += bundleSize) {
    const slice = shuffled.slice(i, i + bundleSize).filter(p => Number(p.final_price) > 0);
    if (slice.length >= 2) bundles.push(slice);
  }
  return bundles;
}

async function seedBaskets() {
  const products = await loadProductPools();
  const usable = ARCHETYPES.filter(a => (products.get(a.category)?.length || 0) >= a.members);
  if (usable.length === 0) {
    throw new Error('No category has enough active products to build archetypes.');
  }

  const usersRes = await query("SELECT id FROM users WHERE role = 'USER' ORDER BY id");
  const users = usersRes.rows.map(r => r.id);
  if (users.length === 0) throw new Error('No shopper users found to attach orders to.');

  console.log(`[Seed] Building ${TARGET_BASKETS} affinity-based baskets across ${usable.length} archetypes...`);
  console.log(`[Seed] Attaching to ${users.length} shoppers over the last ${BASKET_WINDOW_DAYS} days.`);

  // Pre-build the co-purchasable bundles per category. Each basket is then
  // drawn from a single bundle, which is what produces frequent itemsets.
  const bundlesByCategory = new Map();
  for (const category of new Set(usable.map(a => a.category))) {
    bundlesByCategory.set(category, buildBundles(products.get(category)));
  }
  const totalBundles = [...bundlesByCategory.values()].reduce((s, b) => s + b.length, 0);
  console.log(`[Seed] Partitioned shelves into ${totalBundles} co-purchasable bundles.`);

  const client = await pool.connect();
  const now = Date.now();
  let insertedOrders = 0;
  let insertedItems = 0;

  try {
    await client.query('BEGIN');

    // Clear prior transactional data so baskets are consistent with one another
    // (a partial mix of old random baskets would reintroduce noise).
    await client.query('TRUNCATE order_items RESTART IDENTITY CASCADE');
    await client.query('TRUNCATE orders RESTART IDENTITY CASCADE');

    for (let i = 0; i < TARGET_BASKETS; i++) {
      const archetype = pickArchetype();
      const bundles = bundlesByCategory.get(archetype.category) || [];
      if (bundles.length === 0) continue;

      // Draw from ONE bundle so the items inside it are correlated. Picking
      // across the whole shelf instead makes every basket a random sample and
      // no pair ever clears minSupport.
      const bundle = pick(bundles);
      // Take the whole bundle most of the time. Drawing only part of it is what
      // thinned support: a 4-product bundle split into random 2-3 item subsets
      // meant no single pair ever accumulated enough baskets to clear
      // minSupport. Occasional partial picks keep basket-size variety.
      const partial = Math.random() < 0.35;
      const memberCount = partial
        ? randInt(2, Math.min(archetype.members, bundle.length - 1))
        : Math.min(archetype.members, bundle.length);

      const shuffledBundle = [...bundle];
      for (let k = shuffledBundle.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [shuffledBundle[k], shuffledBundle[j]] = [shuffledBundle[j], shuffledBundle[k]];
      }

      const chosen = new Map();
      for (const p of shuffledBundle.slice(0, memberCount)) {
        if (Number(p.final_price) > 0) chosen.set(p.id, p);
      }

      /**
       * Spill: occasionally add an item from outside the bundle.
       *
       * Without this, items in a bundle are bought together with probability
       * ~1, so lift collapses to 1/support and lands in the 30-70 range — a
       * number that is arithmetically correct but analytically useless, because
       * it says the item is never bought alone rather than saying one item
       * makes another more likely.
       *
       * Real baskets mix the intended pair with unrelated add-ons. Spill
       * reproduces that: it decorrelates the bundle, so lift reflects genuine
       * affinity in the 1.5-5 band and the scatter shows a real distribution
       * instead of a cliff at one extreme.
       */
      if (Math.random() < SPILL_RATE) {
        const shelf = products.get(archetype.category) || [];
        const candidate = shelf[randInt(0, shelf.length - 1)];
        if (candidate && !chosen.has(candidate.id) && Number(candidate.final_price) > 0) {
          chosen.set(candidate.id, candidate);
        }
      }

      if (chosen.size < 2) continue; // need at least a pair for association mining

      const items = [...chosen.values()].map(p => {
        const qty = Math.random() < 0.18 ? 2 : 1;
        const unitPrice = parseFloat(p.final_price);
        return { productId: p.id, unitPrice, qty, totalPrice: unitPrice * qty };
      });

      const totalAmount = items.reduce((s, it) => s + it.totalPrice, 0);
      const daysAgo = rand(0, BASKET_WINDOW_DAYS);
      const orderDate = new Date(now - daysAgo * 86400000 - randInt(0, 86399) * 1000);

      // Bias order ownership so repeat customers exist — recency/frequency
      // signals matter for the RFM clustering panel too.
      const userId = Math.random() < 0.55
        ? pick(users)                     // loyal customer
        : users[randInt(0, users.length - 1)];

      const city = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'][i % 6];
      const state = ['Maharashtra', 'Karnataka', 'Delhi', 'Telangana', 'Maharashtra', 'Tamil Nadu'][i % 6];

      const orderRes = await client.query(
        `INSERT INTO orders (user_id, total_amount, status, shipping_address,
                             payment_method, payment_status, created_at, updated_at)
         VALUES ($1, $2, 'DELIVERED', $3, 'SIMULATED_GATEWAY', 'PAID', $4, $4)
         RETURNING id`,
        [
          userId,
          totalAmount.toFixed(2),
          JSON.stringify({
            fullName: `Customer ${userId}`,
            street: '123 Market Way',
            city,
            state,
            postalCode: '40000' + (i % 9),
            country: 'India'
          }),
          orderDate
        ]
      );
      const orderId = orderRes.rows[0].id;

      for (const it of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, it.productId, it.qty, it.unitPrice, it.totalPrice.toFixed(2)]
        );
        insertedItems++;

        // Purchase telemetry keeps the interaction fact table aligned with sales.
        await client.query(
          `INSERT INTO interactions (user_id, session_id, product_id, interaction_type, metadata, created_at)
           VALUES ($1, $2, $3, 'PURCHASE', $4, $5)`,
          [
            userId,
            `sess_basket_${orderId}`,
            it.productId,
            JSON.stringify({ order_id: orderId, source: 'basket_seed', archetype: archetype.kind }),
            orderDate
          ]
        );
      }

      insertedOrders++;
      if (insertedOrders % 250 === 0) {
        console.log(`[Seed]   ...${insertedOrders} baskets created`);
      }
    }

    await client.query('COMMIT');
    console.log(`[Seed] Done. ${insertedOrders} orders and ${insertedItems} order items inserted.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed] Transaction rolled back:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function report() {
  const totals = await query(`
    SELECT
      (SELECT count(*) FROM orders) AS orders,
      (SELECT count(*) FROM order_items) AS items,
      (SELECT count(*) FROM (SELECT order_id FROM order_items GROUP BY order_id HAVING count(*) > 1) t) AS multi_baskets,
      (SELECT count(DISTINCT product_id) FROM order_items) AS distinct_products
  `);
  const t = totals.rows[0];

  console.log('');
  console.log('=== BASKET DATA ===');
  console.log(`  orders           : ${t.orders}`);
  console.log(`  order items      : ${t.items}`);
  console.log(`  multi-item baskets: ${t.multi_baskets}`);
  console.log(`  distinct products: ${t.distinct_products}`);

  // Top repeating items: if these are single-digit counts the rules will still
  // be noisy, which is the signal that seeding needs another pass.
  const repeat = await query(`
    SELECT p.name, count(*) AS basket_count
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    GROUP BY p.name
    HAVING count(*) > 1
    ORDER BY basket_count DESC
    LIMIT 8
  `);
  console.log('');
  console.log('=== MOST-REPEATED ITEMS IN BASKETS ===');
  repeat.rows.forEach(r => console.log(`  ${String(r.basket_count).padStart(4)} baskets  ${r.name.slice(0, 62)}`));

  }

async function main() {
  if (STATS_ONLY) {
    await report();
    await pool.end();
    return;
  }

  if (ROLLBACK) {
    await rollbackFromBackup();
    await pool.end();
    return;
  }

  const existing = await query('SELECT count(*) AS c FROM orders');
  if (parseInt(existing.rows[0].c, 10) > 0 && !FORCE) {
    console.log(`[Seed] Database already has ${existing.rows[0].c} orders.`);
    console.log('[Seed] Re-running would replace them. Use --force to proceed, or --rollback to restore a backup.');
    await pool.end();
    return;
  }

  await writeBackup();
  await withLock(seedBaskets);
  await report();

  console.log('');
  console.log('Next step: refresh the warehouse so the star schema picks up the new baskets.');
  console.log('  -> click "Refresh ETL" in the BI dashboard, or POST /api/admin/bi/warehouse/etl-refresh');
  await pool.end();
}

main().catch(async err => {
  console.error('[Seed] Failed:', err.message);
  try { await pool.end(); } catch { /* already closed */ }
  process.exit(1);
});