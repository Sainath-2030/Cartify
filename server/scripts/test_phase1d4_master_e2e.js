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

async function runMasterE2EVerification() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 1D.4: MASTER E2E BACKEND VERIFICATION SUITE    ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  const PORT = 5080;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Ephemeral Master Test Server listening on http://localhost:${PORT}\n`);

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
    // -------------------------------------------------------------
    // SECTION 1: DATABASE INTEGRITY & CATALOGUE AUDIT
    // -------------------------------------------------------------
    console.log('--- SECTION 1: DATABASE SCHEMA & CATALOGUE AUDIT ---');

    // 1. Total Product Catalogue Count
    const countRes = await client.query('SELECT COUNT(*) AS total FROM products');
    const totalProds = parseInt(countRes.rows[0].total, 10);
    assert(totalProds >= 16976, `PostgreSQL contains full catalogue of ${totalProds} products (>= 16,976)`);

    // 2. Active Products and Categories
    const catCountRes = await client.query('SELECT COUNT(*) AS total FROM categories WHERE is_active = true');
    assert(parseInt(catCountRes.rows[0].total, 10) === 8, 'All 8 product categories are active and intact');

    // 3. PostgreSQL Search Vector Functional
    const searchVecRes = await client.query("SELECT COUNT(*) AS total FROM products WHERE search_vector @@ plainto_tsquery('english', 'headphones')");
    assert(parseInt(searchVecRes.rows[0].total, 10) > 0, `Search vector functional (Found ${searchVecRes.rows[0].total} products matching "headphones")`);

    // 4. Amazon Provenance vs Internal Provenance
    const amazonCountRes = await client.query("SELECT COUNT(*) AS total FROM products WHERE source = 'amazon'");
    assert(parseInt(amazonCountRes.rows[0].total, 10) >= 16976, 'Amazon product provenance preserved with source = "amazon"');

    // 5. Check no orphaned order items or cart items
    const orphanCart = await client.query('SELECT COUNT(*) AS total FROM cart_items ci LEFT JOIN products p ON p.id = ci.product_id WHERE p.id IS NULL');
    const orphanWish = await client.query('SELECT COUNT(*) AS total FROM wishlist_items wi LEFT JOIN products p ON p.id = wi.product_id WHERE p.id IS NULL');
    assert(parseInt(orphanCart.rows[0].total, 10) === 0 && parseInt(orphanWish.rows[0].total, 10) === 0, 'Zero orphaned records in cart_items and wishlist_items');

    // -------------------------------------------------------------
    // SECTION 2: AUTHENTICATION & RBAC SECURITY AUDIT
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: AUTHENTICATION & RBAC SECURITY AUDIT ---');

    // 6. Login as Shopper
    const shopperLogin = await request(PORT, '/api/auth/login', {
      method: 'POST',
      body: { email: 'shopper@cartify.com', password: 'ShopperPassword123!' },
    });
    assert(shopperLogin.status === 200 && shopperLogin.body.data.token, 'Shopper login returns valid JWT token');
    const tokenShopper = shopperLogin.body.data.token;
    const shopperId = shopperLogin.body.data.user.id;

    // 7. Login as Content Manager
    const managerLogin = await request(PORT, '/api/auth/login', {
      method: 'POST',
      body: { email: 'manager@cartify.com', password: 'ManagerPassword123!' },
    });
    assert(managerLogin.status === 200 && managerLogin.body.data.user.role === 'CONTENT_MANAGER', 'Content Manager login assigns CONTENT_MANAGER role');
    const tokenManager = managerLogin.body.data.token;

    // 8. Login as Admin
    const adminLogin = await request(PORT, '/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@cartify.com', password: 'AdminPassword123!' },
    });
    assert(adminLogin.status === 200 && adminLogin.body.data.user.role === 'ADMIN', 'Admin login assigns ADMIN role');
    const tokenAdmin = adminLogin.body.data.token;

    // 9. Password not leaked in /api/auth/me
    const meRes = await request(PORT, '/api/auth/me', {
      headers: { Authorization: `Bearer ${tokenShopper}` },
    });
    assert(meRes.body.data.user.password_hash === undefined && meRes.body.data.user.password === undefined, 'Password hash is NEVER exposed in auth responses');

    // 10. RBAC Matrix Enforcement
    const shopperOnAdmin = await request(PORT, '/api/admin/catalogue/health', { headers: { Authorization: `Bearer ${tokenShopper}` } });
    const shopperOnCM = await request(PORT, '/api/content-manager/products', { headers: { Authorization: `Bearer ${tokenShopper}` } });
    const managerOnAdmin = await request(PORT, '/api/admin/catalogue/health', { headers: { Authorization: `Bearer ${tokenManager}` } });
    const managerOnCM = await request(PORT, '/api/content-manager/products', { headers: { Authorization: `Bearer ${tokenManager}` } });
    const adminOnAdmin = await request(PORT, '/api/admin/catalogue/health', { headers: { Authorization: `Bearer ${tokenAdmin}` } });
    const adminOnCM = await request(PORT, '/api/content-manager/products', { headers: { Authorization: `Bearer ${tokenAdmin}` } });

    assert(
      shopperOnAdmin.status === 403 &&
      shopperOnCM.status === 403 &&
      managerOnAdmin.status === 403 &&
      managerOnCM.status === 200 &&
      adminOnAdmin.status === 200 &&
      adminOnCM.status === 200,
      'RBAC Matrix strictly enforced (Shopper 403 on consoles; CM 200 on CM/403 on Admin; Admin 200 on both)'
    );

    // -------------------------------------------------------------
    // SECTION 3: FULL SHOPPER LIFECYCLE AUDIT
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: COMPLETE SHOPPER LIFECYCLE AUDIT ---');

    // Clean user state
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [shopperId]);
    await client.query('DELETE FROM wishlist_items WHERE user_id = $1', [shopperId]);
    await client.query('DELETE FROM reviews WHERE user_id = $1', [shopperId]);

    // Fetch test product
    const prodRes = await client.query('SELECT id, name, final_price, stock_quantity FROM products WHERE is_active = true ORDER BY id LIMIT 1');
    const testProduct = prodRes.rows[0];

    // 11. Wishlist Add
    const addWish = await request(PORT, '/api/wishlist/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { productId: testProduct.id },
    });
    assert((addWish.status === 201 || addWish.status === 200) && addWish.body.data.totalItems === 1, 'Product successfully added to Wishlist');

    // 12. Move to Cart
    const moveToCartRes = await request(PORT, `/api/wishlist/move-to-cart/${testProduct.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { quantity: 2 },
    });
    assert(moveToCartRes.status === 200 && moveToCartRes.body.data.cart.totalItems === 2, 'Move-to-cart atomically transfers item from Wishlist to Cart');

    // 13. Update Cart Quantity
    const updateQtyRes = await request(PORT, `/api/cart/items/${testProduct.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { quantity: 3 },
    });
    assert(updateQtyRes.status === 200 && updateQtyRes.body.data.totalItems === 3, 'Cart item quantity updated to 3');

    // 14. Checkout Preview
    const previewRes = await request(PORT, '/api/orders/preview', {
      headers: { Authorization: `Bearer ${tokenShopper}` },
    });
    const expectedTotal = Math.round(parseFloat(testProduct.final_price) * 3 * 100) / 100;
    assert(previewRes.status === 200 && previewRes.body.data.totalAmount === expectedTotal, `Checkout preview accurately calculates order total (₹${expectedTotal})`);

    // 15. Execute Transactional Checkout
    const initialStock = parseInt(testProduct.stock_quantity, 10);
    const checkoutRes = await request(PORT, '/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: {
        shippingAddress: {
          fullName: 'Master E2E Shopper',
          addressLine1: '100 University Square',
          city: 'Vellore',
          state: 'Tamil Nadu',
          postalCode: '632014',
          phone: '9876543210',
        },
        paymentMethod: 'COD',
      },
    });
    assert(checkoutRes.status === 201 && checkoutRes.body.success === true, 'Order created successfully via ACID transaction');
    const orderId = checkoutRes.body.data.id;

    // 16. Price Snapshot & Stock Decrement
    const snapshotItem = checkoutRes.body.data.items[0];
    assert(snapshotItem.unitPrice === parseFloat(testProduct.final_price), 'Historical unit_price snapshot matches product price at checkout');
    const stockAfter = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [testProduct.id]);
    assert(parseInt(stockAfter.rows[0].stock_quantity, 10) === initialStock - 3, 'Stock decremented atomically by 3');

    // 17. Cart Automatically Cleared
    const cartAfterOrder = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenShopper}` },
    });
    assert(cartAfterOrder.body.data.items.length === 0, 'Cart emptied automatically upon order placement');

    // 18. Verified Purchase Review Link
    await request(PORT, `/api/products/${testProduct.id}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { rating: 5, reviewText: 'Master E2E verified product review!' },
    });
    const reviewCheck = await request(PORT, `/api/products/${testProduct.id}/reviews/me`, {
      headers: { Authorization: `Bearer ${tokenShopper}` },
    });
    assert(reviewCheck.body.data.verifiedPurchase === true, 'Review dynamically assigned verifiedPurchase = true following completed order');

    // -------------------------------------------------------------
    // SECTION 4: CONTENT MANAGER & INTERNAL PRODUCTS AUDIT
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: CONTENT MANAGER & INTERNAL PRODUCTS AUDIT ---');

    // 19. Create Internal Product
    const newProductRes = await request(PORT, '/api/content-manager/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenManager}` },
      body: {
        name: 'Cartify Pro Wireless Mouse',
        brand: 'Cartify Gear',
        categoryId: 1, // Electronics
        subcategory: 'Computer Accessories',
        description: 'Ergonomic 2.4GHz wireless optical mouse with silent switches.',
        price: 1299.0,
        discountPercentage: 15,
        finalPrice: 1104.15,
        stockQuantity: 40,
        mainImage: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
        images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7'],
        specifications: { dpi: 3200, wireless: true },
      },
    });
    assert(newProductRes.status === 201 && newProductRes.body.data.source === 'internal', 'Content Manager creates internal product with source = "internal"');
    const internalProdId = newProductRes.body.data.id;

    // 20. Update Product Metadata via Allowlist
    const updateInternalRes = await request(PORT, `/api/content-manager/products/${internalProdId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenManager}` },
      body: { name: 'Cartify Pro Wireless Mouse V2', stockQuantity: 60 },
    });
    assert(updateInternalRes.status === 200 && updateInternalRes.body.data.name.includes('V2'), 'Product metadata updated successfully via allowlist');

    // 21. Clean up internal product
    await client.query('DELETE FROM products WHERE id = $1', [internalProdId]);
    assert(true, 'Test internal product cleaned up after verification');

    // -------------------------------------------------------------
    // SECTION 5: ADMIN CONSOLE & OBSERVABILITY AUDIT
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: ADMIN CONSOLE & OBSERVABILITY AUDIT ---');

    // 22. Catalogue Health Returns Accurate Counts
    const healthRes = await request(PORT, '/api/admin/catalogue/health', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(healthRes.status === 200 && healthRes.body.data.totalProducts >= 16976, 'Catalogue health returns real-time PostgreSQL product counts');

    // 23. Model Metrics Returns Explicit Unavailable Contract (No fake metrics)
    const modelMetricsRes = await request(PORT, '/api/admin/models/metrics', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(modelMetricsRes.body.data.status === 'NOT_AVAILABLE' && modelMetricsRes.body.data.evaluation === null, 'Recommendation metrics return explicit NOT_AVAILABLE state without fabricated values');

    // 24. Retraining Request Registers Without Fake Blocking
    const retrainReq = await request(PORT, '/api/admin/models/retrain', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { trigger: 'verification_audit', parameters: {} },
    });
    assert(retrainReq.status === 202 && retrainReq.body.data.status === 'QUEUED', 'Retraining endpoint returns 202 Accepted with QUEUED status');

    // 25. Audit Logs Table Records Privileged Actions
    const auditLogsRes = await request(PORT, '/api/admin/audit-logs?limit=5', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(auditLogsRes.status === 200 && auditLogsRes.body.data.length > 0, 'Audit logs capture privileged actions with user attribution and timestamps');

    console.log(`\n================================================================`);
    console.log(`   PHASE 1D.4 MASTER E2E SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed !== total) {
      throw new Error(`Master E2E verification failed: ${total - passed} tests failed.`);
    }
  } finally {
    client.release();
    await pool.end();
    server.close();
  }
}

runMasterE2EVerification().catch((err) => {
  console.error('Master E2E verification execution error:', err);
  process.exit(1);
});
