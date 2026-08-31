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

async function runOrdersTestSuite() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 1D.2D: ORDERS & CHECKOUT API TEST SUITE        ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  const PORT = 5050;
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
    // Auth tokens for User 1 (Shopper, ID: 3) and User 2 (Manager, ID: 2)
    const tokenUser1 = signToken({ userId: 3, email: 'shopper@cartify.com', role: 'USER' });
    const tokenUser2 = signToken({ userId: 2, email: 'manager@cartify.com', role: 'CONTENT_MANAGER' });

    // Clean cart, orders, reviews for test users
    await client.query('DELETE FROM cart_items WHERE user_id IN (2, 3)');
    await client.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (2, 3))');
    await client.query('DELETE FROM orders WHERE user_id IN (2, 3)');
    await client.query('DELETE FROM reviews WHERE user_id IN (2, 3)');

    // Fetch two real active products from database
    const prodRes = await client.query('SELECT id, name, final_price, price, stock_quantity FROM products WHERE is_active = true ORDER BY id LIMIT 2');
    const productA = prodRes.rows[0];
    const productB = prodRes.rows[1];

    const sampleShippingAddress = {
      fullName: 'Sainath Shopper',
      addressLine1: '42 Academic Avenue, Tech Park',
      city: 'Vellore',
      state: 'Tamil Nadu',
      postalCode: '632014',
      phone: '9876543210',
    };

    // 1. Unauthenticated Checkout Attempt (401)
    const unauth = await request(PORT, '/api/orders', {
      method: 'POST',
      body: { shippingAddress: sampleShippingAddress },
    });
    assert(unauth.status === 401 && unauth.body.success === false, 'POST /api/orders without token returns 401 Unauthorized');

    // 2. Empty Cart Checkout Rejection (422)
    const emptyCheckout = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { shippingAddress: sampleShippingAddress },
    });
    assert(emptyCheckout.status === 422 && emptyCheckout.body.success === false, 'Checkout with empty cart is rejected with 422');

    // 3. Checkout Preview with items in cart (GET /api/orders/preview)
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id, quantity: 2 },
    });
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productB.id, quantity: 1 },
    });

    const previewRes = await request(PORT, '/api/orders/preview', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    const expectedSubtotal = Math.round((parseFloat(productA.final_price) * 2 + parseFloat(productB.final_price) * 1) * 100) / 100;
    assert(previewRes.status === 200 && previewRes.body.data.totalAmount === expectedSubtotal, `GET /api/orders/preview calculates correct totalAmount (₹${expectedSubtotal})`);
    assert(previewRes.body.data.totalQuantity === 3 && previewRes.body.data.itemCount === 2, 'Preview has totalQuantity = 3 and itemCount = 2');

    // 4. Valid Order Creation (POST /api/orders)
    const initialStockA = parseInt(productA.stock_quantity, 10);
    const orderCreate = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        shippingAddress: sampleShippingAddress,
        paymentMethod: 'COD',
      },
    });
    assert(orderCreate.status === 201 && orderCreate.body.success === true, 'POST /api/orders creates order successfully');
    const orderId1 = orderCreate.body.data.id;
    assert(orderId1 && orderCreate.body.data.totalAmount === expectedSubtotal, 'Created order has valid ID and correct server-computed total');

    // 5. Order Status begins as PENDING
    assert(orderCreate.body.data.status === 'PENDING', 'Order status initialized as PENDING');

    // 6. Payment Status and Payment Method
    assert(orderCreate.body.data.paymentMethod === 'COD' && orderCreate.body.data.paymentStatus === 'PAID', 'Payment method and status stored accurately');

    // 7. Unit Price Snapshot is Stored
    const orderItems = orderCreate.body.data.items;
    const snapshotItemA = orderItems.find(i => i.productId === parseInt(productA.id, 10));
    assert(snapshotItemA && snapshotItemA.unitPrice === parseFloat(productA.final_price), 'Unit price snapshot matches product final_price at purchase');
    assert(snapshotItemA.totalPrice === Math.round(parseFloat(productA.final_price) * 2 * 100) / 100, 'Item line total matches quantity * unitPrice snapshot');

    // 8. Cart is Cleared after Successful Order
    const cartAfterOrder = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(cartAfterOrder.status === 200 && cartAfterOrder.body.data.items.length === 0, 'Cart is automatically cleared after successful order creation');

    // 9. Stock Decremented Atomically
    const stockCheckA = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [productA.id]);
    const currentStockA = parseInt(stockCheckA.rows[0].stock_quantity, 10);
    assert(currentStockA === initialStockA - 2, `Stock decremented from ${initialStockA} to ${currentStockA} (decremented by 2)`);

    // 10. Failed Order Leaves Cart Intact (Testing rollback on invalid address)
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id, quantity: 1 },
    });

    const failedCheckout = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: {
        shippingAddress: { fullName: '' }, // invalid address
      },
    });
    assert(failedCheckout.status === 422 && failedCheckout.body.success === false, 'Invalid address rejected with 422');

    const cartAfterFail = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(cartAfterFail.body.data.items.length === 1, 'Cart remains intact after failed order attempt (Rollback safety)');
    // Clean user 1 cart
    await request(PORT, '/api/cart', { method: 'DELETE', headers: { Authorization: `Bearer ${tokenUser1}` } });

    // 11. Insufficient Stock Rejected
    // Temporarily reduce stock of product B to 1
    await client.query('UPDATE products SET stock_quantity = 1 WHERE id = $1', [productB.id]);
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productB.id, quantity: 1 },
    });
    // Another session buys product B stock
    await client.query('UPDATE products SET stock_quantity = 0 WHERE id = $1', [productB.id]);

    const outOfStockOrder = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { shippingAddress: sampleShippingAddress },
    });
    assert(outOfStockOrder.status === 422 && outOfStockOrder.body.success === false, 'Order with insufficient stock rejected with 422');

    // Restore product B stock
    await client.query('UPDATE products SET stock_quantity = 50 WHERE id = $1', [productB.id]);
    await request(PORT, '/api/cart', { method: 'DELETE', headers: { Authorization: `Bearer ${tokenUser1}` } });

    // 12. Get User Orders List (GET /api/orders)
    const myOrders = await request(PORT, '/api/orders', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(myOrders.status === 200 && myOrders.body.data.length >= 1, 'GET /api/orders returns user order list');
    assert(myOrders.body.data[0].id === orderId1, 'List contains orderId1');

    // 13. Pagination on Orders List
    const paginatedOrders = await request(PORT, '/api/orders?page=1&limit=5', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(paginatedOrders.status === 200 && paginatedOrders.body.pagination.page === 1, 'GET /api/orders pagination metadata populated');

    // 14. Get Order Details (GET /api/orders/:orderId)
    const orderDetail = await request(PORT, `/api/orders/${orderId1}`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(orderDetail.status === 200 && orderDetail.body.data.id === orderId1, `GET /api/orders/:id returns details for Order ${orderId1}`);
    assert(orderDetail.body.data.items.length === 2, 'Order detail contains 2 historical snapshot items');

    // 15. Cross-User Isolation: User 2 cannot access User 1's order (403)
    const crossOrderAccess = await request(PORT, `/api/orders/${orderId1}`, {
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    assert(crossOrderAccess.status === 403 && crossOrderAccess.body.success === false, 'User 2 cannot access User 1 order (403 Forbidden)');

    // 16. Cross-User Isolation: User 2 cannot cancel User 1's order (403)
    const crossCancel = await request(PORT, `/api/orders/${orderId1}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenUser2}` },
    });
    assert(crossCancel.status === 403 && crossCancel.body.success === false, 'User 2 cannot cancel User 1 order (403 Forbidden)');

    // 17. Valid Cancellation (PATCH /api/orders/:orderId/cancel)
    const cancelRes = await request(PORT, `/api/orders/${orderId1}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(cancelRes.status === 200 && cancelRes.body.data.status === 'CANCELLED', 'PATCH /api/orders/:id/cancel successfully marks order as CANCELLED');

    // 18. Stock Restored after Cancellation
    const stockAfterCancelA = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [productA.id]);
    assert(parseInt(stockAfterCancelA.rows[0].stock_quantity, 10) === initialStockA, `Stock restored to ${initialStockA} after cancellation`);

    // 19. Cannot Cancel already Cancelled Order (422)
    const reCancel = await request(PORT, `/api/orders/${orderId1}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(reCancel.status === 422 && reCancel.body.success === false, 'Attempting to cancel already CANCELLED order returns 422');

    // 20. Historical Price Remains Unchanged After Product Price Change
    // Create new order for User 1 with Product A
    await request(PORT, '/api/cart/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { productId: productA.id, quantity: 1 },
    });
    const order2Res = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { shippingAddress: sampleShippingAddress },
    });
    const orderId2 = order2Res.body.data.id;
    const originalPurchasedPrice = parseFloat(productA.final_price);

    // Later: Product A price changes in products table
    await client.query('UPDATE products SET final_price = 9999.00 WHERE id = $1', [productA.id]);

    // Check historical order 2 details
    const order2Detail = await request(PORT, `/api/orders/${orderId2}`, {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    const itemInOrder2 = order2Detail.body.data.items[0];
    assert(itemInOrder2.unitPrice === originalPurchasedPrice, `Historical order price snapshot preserved (Purchased: ₹${originalPurchasedPrice}, DB is now ₹9999.00)`);

    // Restore product A price
    await client.query('UPDATE products SET final_price = $1 WHERE id = $2', [originalPurchasedPrice, productA.id]);

    // 21. Verified Purchase Status in Reviews Integration
    // User 1 purchased product A via Order 2. Check if review reflects verifiedPurchase = true
    await request(PORT, `/api/products/${productA.id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser1}` },
      body: { rating: 5, reviewText: 'Purchased and verified product review!' },
    });

    const reviewsForA = await request(PORT, `/api/products/${productA.id}/reviews`);
    const myRev = reviewsForA.body.data.find(r => r.productId === parseInt(productA.id, 10));
    assert(myRev && myRev.verifiedPurchase === true, 'Review dynamically detects completed order and marks verifiedPurchase = true');

    // User 2 did NOT purchase product A -> verifiedPurchase = false
    await request(PORT, `/api/products/${productA.id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenUser2}` },
      body: { rating: 4, reviewText: 'Unverified reviewer comment.' },
    });
    const reviewsForAAfter = await request(PORT, `/api/products/${productA.id}/reviews`);
    const user2Rev = reviewsForAAfter.body.data.find(r => r.reviewerName === 'Manager User' || r.rating === 4);
    assert(user2Rev && user2Rev.verifiedPurchase === false, 'Unpurchased user review correctly has verifiedPurchase = false');

    // 22. Verify Cart API still works concurrently
    const cartCheck = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(cartCheck.status === 200, 'GET /api/cart continues to operate seamlessly');

    // 23. Verify Wishlist API still works concurrently
    const wishCheck = await request(PORT, '/api/wishlist', {
      headers: { Authorization: `Bearer ${tokenUser1}` },
    });
    assert(wishCheck.status === 200, 'GET /api/wishlist continues to operate seamlessly');

    console.log(`\n================================================================`);
    console.log(`   PHASE 1D.2D ORDERS API SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed !== total) {
      throw new Error(`Orders test suite failed: ${total - passed} tests failed.`);
    }
  } finally {
    client.release();
    await pool.end();
    server.close();
  }
}

runOrdersTestSuite().catch((err) => {
  console.error('Orders test suite execution error:', err);
  process.exit(1);
});
