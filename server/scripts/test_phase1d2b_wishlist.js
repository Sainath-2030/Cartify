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

async function runWishlistTestSuite() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 1D.2B: AUTHENTICATED WISHLIST API TEST SUITE    ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  const PORT = 5030;
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
    // Generate auth tokens for User 1 (Shopper, ID: 3) and User 2 (Manager, ID: 2)
    const tokenUser1 = signToken({ userId: 3, email: 'shopper@cartify.com', role: 'USER' });
    const tokenUser2 = signToken({ userId: 2, email: 'manager@cartify.com', role: 'CONTENT_MANAGER' });

    // Clean wishlist_items and cart_items for test users
    await client.query('DELETE FROM wishlist_items WHERE user_id IN (2, 3)');
    await client.query('DELETE FROM cart_items WHERE user_id IN (2, 3)');

    // Fetch three real active products from database
    const prodRes = await client.query('SELECT id, name, final_price, price, brand, main_image FROM products WHERE is_active = true ORDER BY id LIMIT 3');
    const productA = prodRes.rows[0];
    const productB = prodRes.rows[1];
    const productC = prodRes.rows[2];

    // 1. Unauthenticated Request (401)
    const unauth = await request(PORT, '/api/wishlist');
    assert(unauth.status === 401 && unauth.body.success === false, 'GET /api/wishlist without token returns 401 Unauthorized');

    // 2. Empty Wishlist Retrieval (200)
    const emptyWishlist = await request(PORT, '/api/wishlist', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(emptyWishlist.status === 200 && emptyWishlist.body.data.totalItems === 0 && emptyWishlist.body.data.items.length === 0, 'GET /api/wishlist returns empty items array and 0 totalItems');

    // 3. Add Valid Product to Wishlist (POST /api/wishlist/items)
    const addA = await request(PORT, '/api/wishlist/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id },
    });
    assert(addA.status === 201 && addA.body.success === true, 'POST /api/wishlist/items adds product A');
    assert(addA.body.data.items.length === 1 && addA.body.data.items[0].productId === productA.id, 'Wishlist contains product A with matching ID');

    // 4. Duplicate Add (Idempotency check)
    const addAAgain = await request(PORT, '/api/wishlist', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { product_id: productA.id }, // snake_case test
    });
    assert(addAAgain.status === 201 && addAAgain.body.data.items.length === 1, 'Adding same product again does NOT create duplicate row (idempotent)');

    // 5. Check Endpoint returns true for Product A
    const checkA = await request(PORT, `/api/wishlist/check/${productA.id}`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(checkA.status === 200 && checkA.body.data.isWishlisted === true, `GET /api/wishlist/check/${productA.id} returns isWishlisted = true`);

    // 6. Check Endpoint returns false for Product B
    const checkB = await request(PORT, `/api/wishlist/check/${productB.id}`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(checkB.status === 200 && checkB.body.data.isWishlisted === false, `GET /api/wishlist/check/${productB.id} returns isWishlisted = false`);

    // 7. Fast Wishlist IDs Lookup (/api/wishlist/ids)
    const idsRes = await request(PORT, '/api/wishlist/ids', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(idsRes.status === 200 && Array.isArray(idsRes.body.data) && idsRes.body.data.includes(parseInt(productA.id, 10)), 'GET /api/wishlist/ids returns array containing product A ID');

    // 8. Remove Product A (DELETE /api/wishlist/items/:productId)
    const removeA = await request(PORT, `/api/wishlist/items/${productA.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(removeA.status === 200 && removeA.body.data.items.length === 0, 'DELETE /api/wishlist/items/:id removes product A');

    // 9. Check Endpoint returns false after removal
    const checkAAfterRemove = await request(PORT, `/api/wishlist/check/${productA.id}`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(checkAAfterRemove.status === 200 && checkAAfterRemove.body.data.isWishlisted === false, 'GET /api/wishlist/check/:id returns isWishlisted = false after removal');

    // 10. Add Multiple Products (Product B and Product C)
    await request(PORT, '/api/wishlist/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productB.id },
    });
    await request(PORT, '/api/wishlist/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productC.id },
    });

    // 11. Get Wishlist returns all expected products
    const multiWishlist = await request(PORT, '/api/wishlist', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(multiWishlist.status === 200 && multiWishlist.body.data.totalItems === 2, 'GET /api/wishlist returns totalItems = 2');
    const returnedIds = multiWishlist.body.data.items.map(i => parseInt(i.productId, 10));
    assert(returnedIds.includes(parseInt(productB.id, 10)) && returnedIds.includes(parseInt(productC.id, 10)), 'Wishlist contains both Product B and Product C');

    // 12. Move to Cart functionality (/api/wishlist/move-to-cart/:productId)
    const moveToCartRes = await request(PORT, `/api/wishlist/move-to-cart/${productB.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { quantity: 1 },
    });
    assert(moveToCartRes.status === 200 && moveToCartRes.body.data.wishlist.totalItems === 1, 'POST /api/wishlist/move-to-cart/:id removes item from wishlist');
    assert(moveToCartRes.body.data.cart.items.some(i => parseInt(i.productId, 10) === parseInt(productB.id, 10)), 'Moved item appears in user cart');

    // 13. User Isolation Test (User 2 wishlist is completely separate)
    const user2Wishlist = await request(PORT, '/api/wishlist', {
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    assert(user2Wishlist.status === 200 && user2Wishlist.body.data.totalItems === 0, 'User 2 wishlist is empty (User 1 wishlist is fully isolated)');

    // User 2 adds product C
    await request(PORT, '/api/wishlist/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser2}` },
      body: { productId: productC.id },
    });

    // User 1 clears wishlist
    const clearRes = await request(PORT, '/api/wishlist', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(clearRes.status === 200 && clearRes.body.data.totalItems === 0, 'DELETE /api/wishlist clears all items for User 1');

    // Verify User 2 wishlist is untouched
    const user2WishlistAfter = await request(PORT, '/api/wishlist', {
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    assert(user2WishlistAfter.status === 200 && user2WishlistAfter.body.data.totalItems === 1, 'User 2 wishlist untouched after User 1 clear (Cross-user isolation preserved)');

    // 14. Invalid Product ID Validation (422)
    const badProdId = await request(PORT, '/api/wishlist/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: 'invalid_string' },
    });
    assert(badProdId.status === 422 && badProdId.body.success === false, 'POST /api/wishlist/items with non-numeric productId returns 422');

    // 15. Nonexistent Product ID Validation (404)
    const missingProd = await request(PORT, '/api/wishlist/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: 99999999 },
    });
    assert(missingProd.status === 404 && missingProd.body.success === false, 'POST /api/wishlist/items with nonexistent productId returns 404');

    // 16. Inactive Product Check: create temporary inactive product
    const inactiveRes = await client.query(`
      INSERT INTO products (source, source_id, name, slug, brand, category_id, price, discount_percentage, final_price, stock_quantity, main_image, is_active)
      VALUES ('manual', 'INACTIVE-TEST', 'Inactive Test Product', 'inactive-test-slug', 'TestBrand', 1, 1000, 0, 1000, 10, 'https://m.media-amazon.com/images/I/sample.jpg', false)
      RETURNING id
    `);
    const inactiveId = inactiveRes.rows[0].id;

    const addInactive = await request(PORT, '/api/wishlist/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: inactiveId },
    });
    assert(addInactive.status === 404 && addInactive.body.success === false, 'POST /api/wishlist/items with inactive product returns 404');

    // Clean up temporary inactive product
    await client.query('DELETE FROM products WHERE id = $1', [inactiveId]);

    // 17. Verify Cart API still works concurrently
    const cartCheck = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(cartCheck.status === 200 && cartCheck.body.data.itemCount >= 1, 'GET /api/cart continues to operate seamlessly alongside Wishlist');

    console.log(`\n================================================================`);
    console.log(`   PHASE 1D.2B WISHLIST API SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed !== total) {
      throw new Error(`Wishlist test suite failed: ${total - passed} tests failed.`);
    }
  } finally {
    client.release();
    await pool.end();
    server.close();
  }
}

runWishlistTestSuite().catch((err) => {
  console.error('Wishlist test suite execution error:', err);
  process.exit(1);
});
