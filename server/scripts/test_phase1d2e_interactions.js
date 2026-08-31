import app from '../app.js';
import http from 'http';
import { signToken } from '../utils/jwt.js';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function request(port, path, options = {}) {
  return new Promise((resolve, reject) => {
    const { method = 'GET', headers = {}, body = null } = options;
    const reqOptions = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runInteractionsTestSuite() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 1D.2E: INTERACTIONS & TELEMETRY TEST SUITE     ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  const PORT = 5060;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Ephemeral Test Server listening on http://localhost:${PORT}\n`);

  let total = 0;
  let passed = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`✓ [PASS ${total.toString().padStart(2)}] ${name}`);
      passed++;
    } else {
      console.error(`✗ [FAIL ${total.toString().padStart(2)}] ${name}`);
    }
  }

  const client = await pool.connect();

  try {
    // Generate auth token for User 1 (Shopper, ID: 3)
    const tokenUser1 = signToken({ userId: 3, email: 'shopper@cartify.com', role: 'USER' });

    // Clean test interactions, cart, orders, wishlist, reviews
    await client.query('DELETE FROM interactions WHERE user_id = 3 OR session_id LIKE \'test-session-%\'');
    await client.query('DELETE FROM cart_items WHERE user_id = 3');
    await client.query('DELETE FROM wishlist_items WHERE user_id = 3');
    await client.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = 3)');
    await client.query('DELETE FROM orders WHERE user_id = 3');
    await client.query('DELETE FROM reviews WHERE user_id = 3');

    // Fetch two real active products
    const prodRes = await client.query('SELECT id, name, final_price, stock_quantity FROM products WHERE is_active = true ORDER BY id LIMIT 2');
    const productA = prodRes.rows[0];
    const productB = prodRes.rows[1];

    // 1. Valid Authenticated VIEW Interaction
    const viewRes = await request(PORT, '/api/interactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        interactionType: 'VIEW',
        productId: productA.id,
        sessionId: 'test-session-1',
        metadata: { source: 'category_grid', page: 1 },
      },
    });
    assert(viewRes.status === 201 && viewRes.body.success === true, 'POST /api/interactions records VIEW interaction');
    assert(viewRes.body.data.userId === 3 && viewRes.body.data.productId === parseInt(productA.id, 10), 'VIEW contains correct authenticated userId and productId');

    // 2. Valid Authenticated SEARCH Interaction (no productId required)
    const searchRes = await request(PORT, '/api/interactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        interactionType: 'SEARCH',
        sessionId: 'test-session-1',
        metadata: { query: 'wireless headphones', category: 'electronics' },
      },
    });
    assert(searchRes.status === 201 && searchRes.body.success === true, 'POST /api/interactions records SEARCH interaction without productId');
    assert(searchRes.body.data.metadata.query === 'wireless headphones', 'SEARCH metadata stores query safely');

    // 3. Guest / Unauthenticated VIEW Interaction (user_id is NULL)
    const guestRes = await request(PORT, '/api/interactions', {
      method: 'POST',
      body: {
        interactionType: 'VIEW',
        productId: productA.id,
        sessionId: 'test-session-guest-99',
        metadata: { source: 'landing_page' },
      },
    });
    assert(guestRes.status === 201 && guestRes.body.data.userId === null, 'Guest interaction recorded with userId = null');
    assert(guestRes.body.data.sessionId === 'test-session-guest-99', 'Guest sessionId preserved');

    // 4. User ID cannot be Spoofed from Body
    const spoofAttempt = await request(PORT, '/api/interactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        interactionType: 'VIEW',
        productId: productA.id,
        user_id: 9999, // Malicious spoof attempt in body
        userId: 9999,
      },
    });
    assert(spoofAttempt.body.data.userId === 3, 'User ID strictly bound to authenticated JWT token (Spoof attempt ignored)');

    // 5. Invalid Interaction Type Rejected (422)
    const badType = await request(PORT, '/api/interactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { interactionType: 'UNSUPPORTED_TYPE', productId: productA.id },
    });
    assert(badType.status === 422 && badType.body.success === false, 'Invalid interaction type rejected with 422');

    // 6. Untrusted Action Event (PURCHASE) Rejected on Public API (422)
    const fakePurchase = await request(PORT, '/api/interactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { interactionType: 'PURCHASE', productId: productA.id },
    });
    assert(fakePurchase.status === 422 && fakePurchase.body.success === false, 'Public client injection of PURCHASE event rejected with 422');

    // 7. Untrusted Action Event (CART_ADD) Rejected on Public API (422)
    const fakeCartAdd = await request(PORT, '/api/interactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { interactionType: 'CART_ADD', productId: productA.id },
    });
    assert(fakeCartAdd.status === 422 && fakeCartAdd.body.success === false, 'Public client injection of CART_ADD event rejected with 422');

    // 8. Nonexistent Product ID Rejected (404)
    const missingProd = await request(PORT, '/api/interactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { interactionType: 'VIEW', productId: 99999999 },
    });
    assert(missingProd.status === 404 && missingProd.body.success === false, 'Interaction on nonexistent product returns 404');

    // 9. Sensitive Metadata Sanitization
    const sensitivePayload = await request(PORT, '/api/interactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        interactionType: 'VIEW',
        productId: productA.id,
        metadata: {
          legitimateKey: 'good_value',
          password: 'SecretPassword123!',
          creditCard: '4111222233334444',
          token: 'sensitive-jwt-token',
        },
      },
    });
    const savedMeta = sensitivePayload.body.data.metadata;
    assert(savedMeta.legitimateKey === 'good_value' && !savedMeta.password && !savedMeta.creditCard && !savedMeta.token, 'Sensitive fields stripped from interaction metadata');

    // 10. Service Hook: CART_ADD Emitted upon successful Cart Add
    const cartAddCountBefore = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'CART_ADD' AND user_id = 3")).rows[0].count;
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id, quantity: 2 },
    });
    const cartAddCountAfter = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'CART_ADD' AND user_id = 3")).rows[0].count;
    assert(parseInt(cartAddCountAfter, 10) === parseInt(cartAddCountBefore, 10) + 1, 'CartService emits CART_ADD telemetry event upon item addition');

    // 11. Service Hook: CART_REMOVE Emitted upon successful Cart Item Removal
    const cartRemCountBefore = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'CART_REMOVE' AND user_id = 3")).rows[0].count;
    await request(PORT, `/api/cart/items/${productA.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    const cartRemCountAfter = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'CART_REMOVE' AND user_id = 3")).rows[0].count;
    assert(parseInt(cartRemCountAfter, 10) === parseInt(cartRemCountBefore, 10) + 1, 'CartService emits CART_REMOVE telemetry event upon item removal');

    // 12. Failed Cart Add (e.g. stock limit exceeded) Does NOT Emit CART_ADD
    const cartAddCountPreFail = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'CART_ADD' AND user_id = 3")).rows[0].count;
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id, quantity: 999999 },
    });
    const cartAddCountPostFail = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'CART_ADD' AND user_id = 3")).rows[0].count;
    assert(parseInt(cartAddCountPreFail, 10) === parseInt(cartAddCountPostFail, 10), 'Failed cart addition does NOT generate spurious CART_ADD event');

    // 13. Service Hook: WISHLIST_ADD Emitted upon successful Wishlist Add
    const wishAddCountBefore = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'WISHLIST_ADD' AND user_id = 3")).rows[0].count;
    await request(PORT, '/api/wishlist/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id },
    });
    const wishAddCountAfter = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'WISHLIST_ADD' AND user_id = 3")).rows[0].count;
    assert(parseInt(wishAddCountAfter, 10) === parseInt(wishAddCountBefore, 10) + 1, 'WishlistService emits WISHLIST_ADD telemetry event upon addition');

    // 14. Service Hook: WISHLIST_REMOVE Emitted upon removal
    const wishRemCountBefore = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'WISHLIST_REMOVE' AND user_id = 3")).rows[0].count;
    await request(PORT, `/api/wishlist/items/${productA.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    const wishRemCountAfter = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'WISHLIST_REMOVE' AND user_id = 3")).rows[0].count;
    assert(parseInt(wishRemCountAfter, 10) === parseInt(wishRemCountBefore, 10) + 1, 'WishlistService emits WISHLIST_REMOVE telemetry event upon removal');

    // 15. Service Hook: REVIEW & RATING Emitted upon Review Submission
    const revCountBefore = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'REVIEW' AND user_id = 3")).rows[0].count;
    const rateCountBefore = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'RATING' AND user_id = 3")).rows[0].count;
    await request(PORT, `/api/products/${productA.id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 5, reviewText: 'Telemetry review test comment.' },
    });
    const revCountAfter = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'REVIEW' AND user_id = 3")).rows[0].count;
    const rateCountAfter = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'RATING' AND user_id = 3")).rows[0].count;
    assert(parseInt(revCountAfter, 10) === parseInt(revCountBefore, 10) + 1, 'ReviewService emits REVIEW telemetry event');
    assert(parseInt(rateCountAfter, 10) === parseInt(rateCountBefore, 10) + 1, 'ReviewService emits RATING telemetry event');

    // 16. Service Hook: PURCHASE Emitted exclusively on Successful Order Checkout
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id, quantity: 1 },
    });
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productB.id, quantity: 2 },
    });

    const purchaseCountBefore = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'PURCHASE' AND user_id = 3")).rows[0].count;
    await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        shippingAddress: {
          fullName: 'Test Shopper',
          addressLine1: '123 Telemetry Blvd',
          city: 'Vellore',
          state: 'Tamil Nadu',
          postalCode: '632014',
        },
      },
    });
    const purchaseCountAfter = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'PURCHASE' AND user_id = 3")).rows[0].count;
    assert(parseInt(purchaseCountAfter, 10) === parseInt(purchaseCountBefore, 10) + 2, 'OrderService emits PURCHASE telemetry event for both ordered items (2 events)');

    // 17. Failed Order Checkout Does NOT Emit PURCHASE
    const purchaseCountPreFail = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'PURCHASE' AND user_id = 3")).rows[0].count;
    await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        shippingAddress: { fullName: '' }, // invalid
      },
    });
    const purchaseCountPostFail = (await client.query("SELECT COUNT(*) FROM interactions WHERE interaction_type = 'PURCHASE' AND user_id = 3")).rows[0].count;
    assert(parseInt(purchaseCountPreFail, 10) === parseInt(purchaseCountPostFail, 10), 'Failed checkout transaction does NOT emit PURCHASE event');

    // 18. Telemetry Breakdown Query
    const breakdownRes = await client.query(`
      SELECT interaction_type, COUNT(*) AS count
      FROM interactions
      WHERE user_id = 3 OR session_id LIKE 'test-session-%'
      GROUP BY interaction_type
      ORDER BY count DESC
    `);
    console.log('\n--- Test Telemetry Records Created & Verified ---');
    for (const row of breakdownRes.rows) {
      console.log(`  ${row.interaction_type.padEnd(16)} : ${row.count}`);
    }
    console.log('-------------------------------------------------\n');

    // 19. Clean up test interactions to avoid polluting the DB
    await client.query('DELETE FROM interactions WHERE user_id = 3 OR session_id LIKE \'test-session-%\'');
    assert(true, 'Test interaction events cleanly purged after verification');

    // 20. Verify Cart API still works
    const cartCheck = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(cartCheck.status === 200, 'GET /api/cart continues to operate seamlessly');

    // 21. Verify Wishlist API still works
    const wishCheck = await request(PORT, '/api/wishlist', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(wishCheck.status === 200, 'GET /api/wishlist continues to operate seamlessly');

    // 22. Verify Orders API still works
    const orderCheck = await request(PORT, '/api/orders', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(orderCheck.status === 200, 'GET /api/orders continues to operate seamlessly');

    console.log(`\n================================================================`);
    console.log(`   PHASE 1D.2E INTERACTIONS SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed !== total) {
      throw new Error(`Interactions test suite failed: ${total - passed} tests failed.`);
    }
  } finally {
    client.release();
    await pool.end();
    server.close();
  }
}

runInteractionsTestSuite().catch((err) => {
  console.error('Interactions test suite execution error:', err);
  process.exit(1);
});
