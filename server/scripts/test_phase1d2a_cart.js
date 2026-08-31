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

async function runCartTestSuite() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 1D.2A: AUTHENTICATED CART API TEST SUITE        ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  const PORT = 5020;
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
    // Setup test tokens for User 1 (Shopper) and User 2 (Content Manager)
    const tokenUser1 = signToken({ userId: 3, email: 'shopper@cartify.com', role: 'USER' });
    const tokenUser2 = signToken({ userId: 2, email: 'manager@cartify.com', role: 'CONTENT_MANAGER' });

    // Clean cart_items for test users
    await client.query('DELETE FROM cart_items WHERE user_id IN (2, 3)');

    // Fetch two real active products from database
    const prodRes = await client.query('SELECT id, name, final_price, price, stock_quantity FROM products WHERE is_active = true ORDER BY id LIMIT 2');
    const productA = prodRes.rows[0];
    const productB = prodRes.rows[1];

    // 1. Unauthenticated Request (401)
    const unauth = await request(PORT, '/api/cart');
    assert(unauth.status === 401 && unauth.body.success === false, 'GET /api/cart without token returns 401 Unauthorized');

    // 2. Empty Cart Retrieval (200)
    const emptyCart = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(emptyCart.status === 200 && emptyCart.body.data.itemCount === 0 && emptyCart.body.data.subtotal === 0, 'GET /api/cart returns empty items array and 0 subtotal');

    // 3. Add Product to Cart (POST /api/cart/items)
    const addA = await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id, quantity: 2 },
    });
    assert(addA.status === 201 && addA.body.success === true, 'POST /api/cart/items adds product A (qty: 2)');
    assert(addA.body.data.items.length === 1 && addA.body.data.items[0].productId === productA.id, 'Cart contains product A with correct ID');
    assert(addA.body.data.items[0].quantity === 2, 'Product A quantity in cart is 2');

    // 4. Add Same Product Twice (Increments Quantity)
    const addAAgain = await request(PORT, '/api/cart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { product_id: productA.id, quantity: 3 }, // snake_case test
    });
    assert(addAAgain.status === 201 && addAAgain.body.data.items.length === 1, 'Adding same product increments existing row (items length remains 1)');
    assert(addAAgain.body.data.items[0].quantity === 5, 'Product A quantity incremented to 5 (2 + 3)');

    // 5. Add Second Product (Product B)
    const addB = await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productB.id, quantity: 1 },
    });
    assert(addB.status === 201 && addB.body.data.items.length === 2, 'POST /api/cart/items adds product B (cart now has 2 distinct items)');

    // 6. Subtotal & Price Integrity Verification
    const expectedSubtotalA = Math.round(parseFloat(productA.final_price) * 5 * 100) / 100;
    const expectedSubtotalB = Math.round(parseFloat(productB.final_price) * 1 * 100) / 100;
    const expectedTotal = Math.round((expectedSubtotalA + expectedSubtotalB) * 100) / 100;

    assert(addB.body.data.subtotal === expectedTotal, `Cart subtotal correctly computed from PostgreSQL prices (Expected: ₹${expectedTotal}, Got: ₹${addB.body.data.subtotal})`);
    assert(addB.body.data.totalItems === 6, 'totalItems = 6 (5 of Product A + 1 of Product B)');

    // 7. Update Quantity (PATCH /api/cart/items/:productId)
    const updatePatch = await request(PORT, `/api/cart/items/${productA.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { quantity: 4 },
    });
    assert(updatePatch.status === 200 && updatePatch.body.data.items.find(i => i.productId === productA.id).quantity === 4, 'PATCH /api/cart/items/:id updates quantity to 4');

    // 8. Update Quantity (PUT /api/cart/:productId)
    const updatePut = await request(PORT, `/api/cart/${productA.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { quantity: 3 },
    });
    assert(updatePut.status === 200 && updatePut.body.data.items.find(i => i.productId === productA.id).quantity === 3, 'PUT /api/cart/:id updates quantity to 3');

    // 9. User Isolation Test (User 2 cart is completely independent)
    const user2Cart = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    assert(user2Cart.status === 200 && user2Cart.body.data.items.length === 0, 'User 2 cart is empty (User 1 cart items are fully isolated)');

    // User 2 adds product B
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser2}` },
      body: { productId: productB.id, quantity: 2 },
    });

    // User 1 removes product B
    const removeB = await request(PORT, `/api/cart/items/${productB.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(removeB.status === 200 && removeB.body.data.items.length === 1, 'DELETE /api/cart/items/:id removes product B from User 1');

    // Verify User 2's Product B was NOT affected
    const user2CartAfter = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    assert(user2CartAfter.body.data.items.length === 1 && user2CartAfter.body.data.items[0].quantity === 2, 'User 2 cart unchanged after User 1 delete (Ownership isolation preserved)');

    // 10. Clear Cart (DELETE /api/cart)
    const clearRes = await request(PORT, '/api/cart', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(clearRes.status === 200 && clearRes.body.data.items.length === 0 && clearRes.body.data.subtotal === 0, 'DELETE /api/cart clears all items from User 1');

    // 11. Invalid Product ID Validation (400 / 422)
    const badProdId = await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: 'invalid-id', quantity: 1 },
    });
    assert(badProdId.status === 422 && badProdId.body.success === false, 'POST /api/cart/items with non-numeric productId returns 422');

    // 12. Nonexistent Product ID Validation (404)
    const nonExistent = await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: 99999999, quantity: 1 },
    });
    assert(nonExistent.status === 404 && nonExistent.body.success === false, 'POST /api/cart/items with non-existent productId returns 404');

    // 13. Invalid Quantity Value (422)
    const badQty = await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id, quantity: -5 },
    });
    assert(badQty.status === 422 && badQty.body.success === false, 'POST /api/cart/items with negative quantity returns 422');

    // 14. Quantity Exceeding Stock Validation (422)
    const exceedStock = await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id, quantity: 51 },
    });
    assert(exceedStock.status === 422 && exceedStock.body.success === false, 'POST /api/cart/items exceeding stock limit returns 422');

    // 15. Attempting to Update Non-Existent Cart Item (404)
    const updateMissing = await request(PORT, `/api/cart/items/${productB.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { quantity: 2 },
    });
    assert(updateMissing.status === 404 && updateMissing.body.success === false, 'PATCH on item not currently in user cart returns 404');

    console.log(`\n================================================================`);
    console.log(`   PHASE 1D.2A CART API SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed !== total) {
      throw new Error(`Cart test suite failed: ${total - passed} tests failed.`);
    }
  } finally {
    client.release();
    await pool.end();
    server.close();
  }
}

runCartTestSuite().catch((err) => {
  console.error('Cart test suite execution error:', err);
  process.exit(1);
});
