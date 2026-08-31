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
    if (body && method !== 'GET') {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runCheckoutIntegrationTests() {
  console.log('================================================================');
  console.log('   CARTIFY CHECKOUT INTEGRATION & VALIDATION TEST SUITE         ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  const PORT = 5090;
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
    const tokenShopper = signToken({ userId: 3, email: 'shopper@cartify.com', role: 'USER' });
    const shopperId = 3;

    // Fetch test product
    const pRes = await client.query('SELECT id, name, final_price, stock_quantity FROM products WHERE is_active = true ORDER BY id LIMIT 1');
    const testProduct = pRes.rows[0];

    const validAddress = {
      fullName: 'John Doe',
      addressLine1: '42 Tech Avenue, Campus View',
      city: 'Vellore',
      state: 'Tamil Nadu',
      postalCode: '632014',
      phone: '9876543210',
    };

    // 1. Unauthenticated user cannot checkout (401)
    const unauth = await request(PORT, '/api/orders', {
      method: 'POST',
      body: { shippingAddress: validAddress, paymentMethod: 'COD' },
    });
    assert(unauth.status === 401, 'Unauthenticated POST /api/orders returns 401 Unauthorized');

    // 2. Empty cart cannot checkout (422)
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [shopperId]);
    const emptyCartRes = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { shippingAddress: validAddress, paymentMethod: 'COD' },
    });
    assert(emptyCartRes.status === 422, 'Empty cart returns 422 Unprocessable Entity');

    // Add item to cart
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { productId: testProduct.id, quantity: 1 },
    });

    // 3. Invalid paymentMethod (e.g. PROTOTYPE_COD) fails validation (422)
    const invalidPayRes = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { shippingAddress: validAddress, paymentMethod: 'PROTOTYPE_COD' },
    });
    assert(invalidPayRes.status === 422 && invalidPayRes.body.errors?.paymentMethod !== undefined, 'Invalid payment method "PROTOTYPE_COD" rejected with 422 and field error');

    // 4. Missing full name (<2 chars) fails validation (422)
    const shortNameRes = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { shippingAddress: { ...validAddress, fullName: 'J' }, paymentMethod: 'COD' },
    });
    assert(shortNameRes.status === 422 && shortNameRes.body.errors['shippingAddress.fullName'] !== undefined, 'Short recipient name rejected with 422');

    // 5. Short address (<5 chars) fails validation (422)
    const shortAddrRes = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { shippingAddress: { ...validAddress, addressLine1: 'St' }, paymentMethod: 'COD' },
    });
    assert(shortAddrRes.status === 422 && shortAddrRes.body.errors['shippingAddress.addressLine1'] !== undefined, 'Short addressLine1 (<5 chars) rejected with 422');

    // 6. Missing city fails validation (422)
    const missCityRes = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { shippingAddress: { ...validAddress, city: '' }, paymentMethod: 'COD' },
    });
    assert(missCityRes.status === 422 && missCityRes.body.errors['shippingAddress.city'] !== undefined, 'Missing city rejected with 422');

    // 7. Missing state fails validation (422)
    const missStateRes = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { shippingAddress: { ...validAddress, state: '' }, paymentMethod: 'COD' },
    });
    assert(missStateRes.status === 422 && missStateRes.body.errors['shippingAddress.state'] !== undefined, 'Missing state rejected with 422');

    // 8. Invalid postal code (<5 digits) fails validation (422)
    const badPinRes = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { shippingAddress: { ...validAddress, postalCode: '123' }, paymentMethod: 'COD' },
    });
    assert(badPinRes.status === 422 && badPinRes.body.errors['shippingAddress.postalCode'] !== undefined, 'Invalid postal code (<5 digits) rejected with 422');

    // 9. Valid Order with "COD" (Demo / Prototype Cash on Delivery) succeeds (201)
    const codOrderRes = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { shippingAddress: validAddress, paymentMethod: 'COD' },
    });
    assert(codOrderRes.status === 201 && codOrderRes.body.success === true, 'Valid order with "COD" creates order successfully');
    assert(codOrderRes.body.data.paymentMethod === 'COD', 'Created order has payment_method = "COD"');

    // Cart is now empty after successful checkout
    const cartAfter = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenShopper}` },
    });
    assert(cartAfter.body.data.items.length === 0, 'Cart emptied automatically after order placement');

    // 10. Valid Order with "SIMULATED_GATEWAY" (Demo / Prototype Digital Simulation) succeeds (201)
    // Add item back to cart
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { productId: testProduct.id, quantity: 1 },
    });

    const digitalOrderRes = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { shippingAddress: validAddress, paymentMethod: 'SIMULATED_GATEWAY' },
    });
    assert(digitalOrderRes.status === 201 && digitalOrderRes.body.success === true, 'Valid order with "SIMULATED_GATEWAY" creates order successfully');
    assert(digitalOrderRes.body.data.paymentMethod === 'SIMULATED_GATEWAY', 'Created order has payment_method = "SIMULATED_GATEWAY"');

    console.log(`\n================================================================`);
    console.log(`   CHECKOUT INTEGRATION SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed !== total) {
      throw new Error(`Checkout integration test failed: ${total - passed} tests failed.`);
    }
  } finally {
    client.release();
    await pool.end();
    server.close();
  }
}

runCheckoutIntegrationTests().catch((err) => {
  console.error('Checkout integration test error:', err);
  process.exit(1);
});
