import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from '../app.js';
import { pool, query } from '../config/db.js';
import { signToken } from '../utils/jwt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function request(server, method, path, headers = {}, bodyData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `http://localhost:${server.address().port}`);
    const reqHeaders = { ...headers };
    if (bodyData && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(data);
        } catch (_) {
          body = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });
    req.on('error', reject);
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runSection12MasterVerification() {
  console.log('================================================================================');
  console.log('   SECTION 12: FINAL MASTER INTEGRATION & END-TO-END SYSTEM VERIFICATION SUITE   ');
  console.log('================================================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Ephemeral Test Server listening on http://localhost:${port}\n`);

  let totalTests = 0;
  let passedTests = 0;
  const failedTests = [];

  function assert(condition, message, detail = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✓ [PASS ${totalTests.toString().padStart(2, '0')}] ${message}${detail ? ' — ' + detail : ''}`);
    } else {
      failedTests.push({ index: totalTests, message, detail });
      console.error(`✗ [FAIL ${totalTests.toString().padStart(2, '0')}] ${message}${detail ? ' — ' + detail : ''}`);
    }
  }

  // Tracking created entities for cleanup
  let createdUserId = null;
  let createdOrderId = null;
  let createdReviewId = null;
  let createdInternalProductId = null;
  const testSessionId = `test_s12_sess_${Date.now()}`;
  const testProductId = 4439; // Canon EOS 200D II DSLR (verified catalogue with CNN embeddings)

  try {
    // =========================================================================
    // PHASE 1: DATABASE INTEGRITY, TAXONOMY & VERIFIED CATALOGUE AUDIT
    // =========================================================================
    console.log('\n--- PHASE 1: DATABASE SCHEMA, TAXONOMY & VERIFIED CATALOGUE AUDIT ---');

    const totalProdsRes = await query('SELECT COUNT(*) AS total FROM products');
    const totalProds = parseInt(totalProdsRes.rows[0].total, 10);
    assert(totalProds >= 16976, 'Product catalogue integrity verified', `Found ${totalProds} total products (>= 16,976)`);

    const verifiedProdsRes = await query("SELECT COUNT(*) AS total FROM products WHERE verification_status = 'VERIFIED' AND is_active = true");
    const verifiedProds = parseInt(verifiedProdsRes.rows[0].total, 10);
    assert(verifiedProds >= 16000, 'Verified Product Display Gate active', `${verifiedProds} products certified as VERIFIED`);

    const catCountRes = await query('SELECT COUNT(*) AS total FROM categories WHERE is_active = true');
    const catCount = parseInt(catCountRes.rows[0].total, 10);
    assert(catCount === 8, 'Catalogue taxonomy intact', 'All 8 core categories active');

    const ftsRes = await query("SELECT COUNT(*) AS total FROM products WHERE search_vector @@ plainto_tsquery('english', 'camera lens')");
    const ftsCount = parseInt(ftsRes.rows[0].total, 10);
    assert(ftsCount > 0, 'PostgreSQL GIN tsvector Full-Text Search operational', `Matches for "camera lens": ${ftsCount}`);

    // =========================================================================
    // PHASE 2: AUTHENTICATION, REGISTRATION & MULTI-ROLE RBAC MATRIX
    // =========================================================================
    console.log('\n--- PHASE 2: AUTHENTICATION, REGISTRATION & MULTI-ROLE RBAC MATRIX ---');

    const testEmail = `s12_shopper_${Date.now()}@cartify.com`;
    const testPassword = 'Password123!';
    const regRes = await request(server, 'POST', '/api/auth/register', {}, {
      fullName: 'Section 12 Test Shopper',
      email: testEmail,
      mobile: '9876543210',
      password: testPassword,
      confirmPassword: testPassword,
      address: '123 Test Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    });
    assert(regRes.status === 201 && regRes.body.success, 'Shopper registration endpoint succeeds', `Created: ${testEmail}`);
    createdUserId = regRes.body.data?.user?.id;
    const userToken = regRes.body.data?.token;
    assert(!!userToken && createdUserId > 0, 'JWT authorization bearer token issued on registration');

    const meRes = await request(server, 'GET', '/api/auth/me', {
      Authorization: `Bearer ${userToken}`,
    });
    assert(meRes.status === 200 && meRes.body.data?.user?.email === testEmail, 'GET /api/auth/me verifies authenticated user identity');

    // RBAC Security Barriers
    const unauthAdminRes = await request(server, 'GET', '/api/admin/catalogue/health');
    assert(unauthAdminRes.status === 401, 'RBAC: Unauthenticated access to /api/admin/* strictly blocked with 401');

    const forbiddenAdminRes = await request(server, 'GET', '/api/admin/catalogue/health', {
      Authorization: `Bearer ${userToken}`,
    });
    assert(forbiddenAdminRes.status === 403, 'RBAC: Shopper (USER) access to /api/admin/* blocked with 403 Forbidden');

    const forbiddenCMRes = await request(server, 'POST', '/api/content-manager/products', {
      Authorization: `Bearer ${userToken}`,
    }, { name: 'Unauthorized Hack Product' });
    assert(forbiddenCMRes.status === 403, 'RBAC: Shopper (USER) access to /api/content-manager/* blocked with 403 Forbidden');

    const adminToken = signToken({ id: 1, email: 'admin@cartify.com', role: 'ADMIN' });
    const cmToken = signToken({ id: 2, email: 'manager@cartify.com', role: 'CONTENT_MANAGER' });

    const authAdminRes = await request(server, 'GET', '/api/admin/catalogue/health', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(authAdminRes.status === 200, 'RBAC: ADMIN role successfully authorized for Admin Console');

    // =========================================================================
    // PHASE 3: TELEMETRY INGESTION PIPELINE (GUEST & USER)
    // =========================================================================
    console.log('\n--- PHASE 3: TELEMETRY INGESTION PIPELINE (GUEST & USER) ---');

    // Guest interaction
    const guestInteractRes = await request(server, 'POST', '/api/interactions', {}, {
      interactionType: 'VIEW',
      productId: testProductId,
      sessionId: testSessionId,
      metadata: { source: 'e2e_guest_test', device: 'desktop' },
    });
    assert(guestInteractRes.status === 200 || guestInteractRes.status === 201, 'Guest interaction event successfully ingested', `Session: ${testSessionId}`);

    // Authenticated interaction
    const userInteractRes = await request(server, 'POST', '/api/interactions', {
      Authorization: `Bearer ${userToken}`,
    }, {
      interactionType: 'SEARCH',
      productId: testProductId,
      sessionId: testSessionId,
      metadata: { query: 'camera', resultCount: 15 },
    });
    assert(userInteractRes.status === 200 || userInteractRes.status === 201, 'Authenticated user interaction successfully ingested');

    const dbInteractCheck = await query('SELECT COUNT(*) AS count FROM interactions WHERE session_id = $1', [testSessionId]);
    assert(parseInt(dbInteractCheck.rows[0].count, 10) >= 2, 'Telemetry interaction rows persisted in PostgreSQL');

    // =========================================================================
    // PHASE 4: MULTI-MODEL RECOMMENDATION ENGINE INFERENCE (ALL 5 MODELS)
    // =========================================================================
    console.log('\n--- PHASE 4: MULTI-MODEL RECOMMENDATION ENGINE INFERENCE (ALL 5 MODELS) ---');

    // Model 1: NCF Status & Architecture
    const modelStatusRes = await request(server, 'GET', '/api/admin/models/status', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(modelStatusRes.status === 200 && modelStatusRes.body.success, 'Model 1 (NCF): Model status & architecture contracts active');

    // Model 2: CNN ResNet-18 Visual Similarity
    const cnnRes = await request(server, 'GET', `/api/products/${testProductId}/similar?limit=4`);
    const cnnList = cnnRes.body.data?.similarProducts || [];
    assert(cnnRes.status === 200 && Array.isArray(cnnList) && cnnList.length > 0, 'Model 2 (CNN ResNet-18): Visual similarity inferences generated', `Returned ${cnnList.length} visual matches`);

    // Model 3: GRU Sequential Session Inference
    const gruSessionRes = await request(server, 'GET', `/api/products/recommendations/for-you?sessionId=${testSessionId}&topK=4`);
    assert(gruSessionRes.status === 200 && gruSessionRes.body.data?.recommendations?.length > 0, 'Model 3 (GRU): Sequential session trajectory recommendations active');

    // Model 4: Collaborative Denoising Autoencoder (CDAE)
    const aeRes = await request(server, 'GET', `/api/admin/models/autoencoder-recommendations?userId=${createdUserId}&topK=4`, {
      Authorization: `Bearer ${adminToken}`,
    });
    const aeList = aeRes.body.recommendations || aeRes.body.data?.recommendations || [];
    assert(aeRes.status === 200 && Array.isArray(aeList) && aeList.length > 0, 'Model 4 (Autoencoder): Latent manifold reconstruction recommendations operational', `Candidates: ${aeList.length}`);

    // Model 5: Attention Fusion Layer (Multi-Modal Dynamic Hybrid)
    const fusionRes = await request(server, 'GET', `/api/admin/models/fusion-recommendations?userId=${createdUserId}&topK=4`, {
      Authorization: `Bearer ${adminToken}`,
    });
    const fusionList = fusionRes.body.recommendations || fusionRes.body.data?.recommendations || [];
    assert(fusionRes.status === 200 && Array.isArray(fusionList) && fusionList.length > 0, 'Model 5 (Attention Fusion): Dynamic Softmax multi-modal aggregation operational', `Recommendations: ${fusionList.length}`);

    // =========================================================================
    // PHASE 5: STOREFRONT AI INTEGRATION & ROUTE PRECEDENCE
    // =========================================================================
    console.log('\n--- PHASE 5: STOREFRONT AI INTEGRATION & ROUTE PRECEDENCE ---');

    // Authenticated Storefront Personalized Feed
    const storeAuthRecs = await request(server, 'GET', '/api/products/recommendations/for-you?topK=4', {
      Authorization: `Bearer ${userToken}`,
    });
    const storeList = storeAuthRecs.body.data?.recommendations || [];
    assert(storeAuthRecs.status === 200 && storeList.length > 0, 'Storefront Home Feed: Delivers personalized recommendation shelf for authenticated users', `Returned ${storeList.length} items (source: ${storeAuthRecs.body.data?.source})`);

    // User Profile Dedicated Recommendations
    const profileRecs = await request(server, 'GET', '/api/users/me/recommendations?limit=4', {
      Authorization: `Bearer ${userToken}`,
    });
    const profList = profileRecs.body.data?.recommendations || [];
    assert(profileRecs.status === 200 && Array.isArray(profList) && profList.length > 0, 'Storefront Profile: Delivers personalized picks via /api/users/me/recommendations');

    // Route precedence guarantee
    const routePrecedenceRes = await request(server, 'GET', '/api/products/recommendations/for-you');
    assert(routePrecedenceRes.status === 200 && !routePrecedenceRes.body.data?.slug, 'Route Precedence: /recommendations/for-you never collides with /products/:slug');

    // =========================================================================
    // PHASE 6: E-COMMERCE LIFECYCLE (WISHLIST, CART & ACID CHECKOUT)
    // =========================================================================
    console.log('\n--- PHASE 6: E-COMMERCE LIFECYCLE (WISHLIST, CART & ACID CHECKOUT) ---');

    // Wishlist: Add item
    const wishAddRes = await request(server, 'POST', '/api/wishlist/items', {
      Authorization: `Bearer ${userToken}`,
    }, { productId: testProductId });
    assert(wishAddRes.status === 200 || wishAddRes.status === 201, 'Wishlist: Successfully saved item to wishlist');

    // Wishlist: Check item
    const wishCheckRes = await request(server, 'GET', `/api/wishlist/check/${testProductId}`, {
      Authorization: `Bearer ${userToken}`,
    });
    assert(wishCheckRes.status === 200 && wishCheckRes.body.data?.isWishlisted === true, 'Wishlist: /api/wishlist/check/:id correctly reports wishlisted status');

    // Wishlist: Move to Cart
    const moveRes = await request(server, 'POST', `/api/wishlist/move-to-cart/${testProductId}`, {
      Authorization: `Bearer ${userToken}`,
    }, { quantity: 2 });
    assert(moveRes.status === 200, 'Wishlist: Move-to-cart atomically transfers item from wishlist to cart');

    // Cart: Verify item in cart
    const cartRes = await request(server, 'GET', '/api/cart', {
      Authorization: `Bearer ${userToken}`,
    });
    assert(cartRes.status === 200 && cartRes.body.data?.items?.some((i) => parseInt(i.productId, 10) === testProductId), 'Cart: Transferred product confirmed in shopping cart');

    // Checkout Preview
    const previewRes = await request(server, 'GET', '/api/orders/preview', {
      Authorization: `Bearer ${userToken}`,
    });
    assert(previewRes.status === 200 && previewRes.body.data?.subtotal > 0, 'Checkout: Server-side preview calculates subtotal, tax, and order totals');

    // Record initial stock for decrement verification
    const preStockRes = await query('SELECT stock_quantity FROM products WHERE id = $1', [testProductId]);
    const initialStock = parseInt(preStockRes.rows[0].stock_quantity, 10);

    // ACID Transactional Checkout
    const orderRes = await request(server, 'POST', '/api/orders', {
      Authorization: `Bearer ${userToken}`,
    }, {
      shippingAddress: {
        fullName: 'Section 12 Test Shopper',
        addressLine1: '123 Innovation Way',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        phone: '9876543210',
      },
      paymentMethod: 'SIMULATED_GATEWAY',
    });
    assert(orderRes.status === 201 && orderRes.body.success, 'Checkout: ACID transactional order placement completes successfully');
    createdOrderId = orderRes.body.data?.id;

    // Verify atomic stock decrement
    const postStockRes = await query('SELECT stock_quantity FROM products WHERE id = $1', [testProductId]);
    const postStock = parseInt(postStockRes.rows[0].stock_quantity, 10);
    assert(postStock === initialStock - 2, 'Checkout: Stock quantity atomically decremented by ordered amount', `${initialStock} -> ${postStock}`);

    // Verify cart cleared after checkout
    const postCartRes = await request(server, 'GET', '/api/cart', {
      Authorization: `Bearer ${userToken}`,
    });
    assert(postCartRes.body.data?.items?.length === 0, 'Checkout: Cart cleared atomically upon successful order');

    // Order cancellation & stock restoration
    const cancelRes = await request(server, 'PATCH', `/api/orders/${createdOrderId}/cancel`, {
      Authorization: `Bearer ${userToken}`,
    });
    assert(cancelRes.status === 200 && cancelRes.body.data?.status === 'CANCELLED', 'Orders: Order cancellation endpoint marks order CANCELLED');

    const restoredStockRes = await query('SELECT stock_quantity FROM products WHERE id = $1', [testProductId]);
    const restoredStock = parseInt(restoredStockRes.rows[0].stock_quantity, 10);
    assert(restoredStock === initialStock, 'Orders: Stock quantity atomically restored upon cancellation', `${postStock} -> ${restoredStock}`);

    // =========================================================================
    // PHASE 7: REVIEWS, RATINGS & UNIQUENESS CONSTRAINTS
    // =========================================================================
    console.log('\n--- PHASE 7: REVIEWS, RATINGS & UNIQUENESS CONSTRAINTS ---');

    // Post authentic review
    const revRes = await request(server, 'POST', `/api/products/${testProductId}/reviews`, {
      Authorization: `Bearer ${userToken}`,
    }, {
      rating: 5,
      reviewText: 'Outstanding build quality and fast delivery. Verified Section 12 test review.',
    });
    assert(revRes.status === 201 && revRes.body.success, 'Reviews: Verified review successfully submitted');
    createdReviewId = revRes.body.data?.id;

    // Uniqueness constraint enforcement (one review per user per product)
    const dupRevRes = await request(server, 'POST', `/api/products/${testProductId}/reviews`, {
      Authorization: `Bearer ${userToken}`,
    }, {
      rating: 4,
      reviewText: 'Attempting duplicate review for same product.',
    });
    assert(dupRevRes.status === 409 || dupRevRes.status === 400 || dupRevRes.body.success === false, 'Reviews: Uniqueness constraint strictly prevents duplicate reviews by same user');

    // Rating summary breakdown
    const summaryRes = await request(server, 'GET', `/api/products/${testProductId}/reviews/summary`);
    assert(summaryRes.status === 200 && summaryRes.body.data?.totalReviews >= 1, 'Reviews: Rating summary breakdown calculates distribution dynamically');

    // =========================================================================
    // PHASE 8: CONTENT MANAGER STUDIO CRUD LIFECYCLE
    // =========================================================================
    console.log('\n--- PHASE 8: CONTENT MANAGER STUDIO CRUD LIFECYCLE ---');

    const internalProdRes = await request(server, 'POST', '/api/content-manager/products', {
      Authorization: `Bearer ${cmToken}`,
    }, {
      name: `S12 Internal Studio Product ${Date.now()}`,
      brand: 'Cartify Studio',
      categoryId: 1, // Electronics
      subcategory: 'Audio',
      description: 'Handcrafted test studio headphone with premium beryllium drivers.',
      price: 9999.00,
      discountPercentage: 15,
      finalPrice: 8499.00,
      stockQuantity: 25,
      mainImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
      specifications: { driver: '40mm Beryllium', impedance: '32 Ohm' },
    });
    assert(internalProdRes.status === 201 && internalProdRes.body.data?.source === 'internal', 'Content Manager: Internal product created with source = "internal"');
    createdInternalProductId = internalProdRes.body.data?.id;

    // Update internal product metadata
    const patchProdRes = await request(server, 'PATCH', `/api/content-manager/products/${createdInternalProductId}`, {
      Authorization: `Bearer ${cmToken}`,
    }, {
      price: 8999.00,
      stockQuantity: 30,
    });
    assert(patchProdRes.status === 200 && (patchProdRes.body.data?.stockQuantity === 30 || patchProdRes.body.data?.stock_quantity === 30), 'Content Manager: Product metadata and stock updated successfully');

    // =========================================================================
    // PHASE 9: ADMIN DIAGNOSTICS & OFFLINE MODEL EVALUATION
    // =========================================================================
    console.log('\n--- PHASE 9: ADMIN DIAGNOSTICS & OFFLINE MODEL EVALUATION ---');

    // Catalogue Health
    const healthRes = await request(server, 'GET', '/api/admin/catalogue/health', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(healthRes.status === 200 && healthRes.body.data?.totalProducts >= 16976, 'Admin: Catalogue health diagnostic monitors live catalogue counts');

    // Conversion Telemetry Funnel
    const funnelRes = await request(server, 'GET', '/api/admin/analytics/funnel', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(funnelRes.status === 200 && Array.isArray(funnelRes.body.data?.stages), 'Admin: Telemetry conversion funnel tracks multi-stage customer journey');

    // Multi-Model Evaluation Benchmarks
    const evalMetricsRes = await request(server, 'GET', '/api/admin/models/metrics', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(
      evalMetricsRes.status === 200 &&
      evalMetricsRes.body.data?.status === 'AVAILABLE' &&
      evalMetricsRes.body.data?.evaluation?.hitRateAt10 !== undefined,
      'Admin: Offline LOO evaluation benchmarks published (HitRate@10, NDCG@10, MRR, Coverage)'
    );

    // Audit Log Inspection
    const auditRes = await request(server, 'GET', '/api/admin/audit-logs?limit=5', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert(auditRes.status === 200 && Array.isArray(auditRes.body.data), 'Admin: Audit logging subsystem records administrative operations');

  } catch (err) {
    console.error('\nUnexpected failure during Section 12 test suite:', err);
    assert(false, 'Exception occurred during test execution', err.message);
  } finally {
    // =========================================================================
    // PHASE 10: AUTOMATED TEARDOWN & CLEANUP HOOKS
    // =========================================================================
    console.log('\n--- PHASE 10: AUTOMATED TEARDOWN & CLEANUP HOOKS ---');

    if (createdReviewId) {
      await query('DELETE FROM reviews WHERE id = $1', [createdReviewId]).catch(() => {});
    }
    if (createdOrderId) {
      await query('DELETE FROM order_items WHERE order_id = $1', [createdOrderId]).catch(() => {});
      await query('DELETE FROM orders WHERE id = $1', [createdOrderId]).catch(() => {});
    }
    if (createdInternalProductId) {
      await query('DELETE FROM products WHERE id = $1', [createdInternalProductId]).catch(() => {});
    }
    if (testSessionId) {
      await query('DELETE FROM interactions WHERE session_id = $1', [testSessionId]).catch(() => {});
    }
    if (createdUserId) {
      await query('DELETE FROM interactions WHERE user_id = $1', [createdUserId]).catch(() => {});
      await query('DELETE FROM wishlist_items WHERE user_id = $1', [createdUserId]).catch(() => {});
      await query('DELETE FROM cart_items WHERE user_id = $1', [createdUserId]).catch(() => {});
      await query('DELETE FROM users WHERE id = $1', [createdUserId]).catch(() => {});
    }

    console.log('✓ Ephemeral test records safely purged from PostgreSQL');

    // Close server and database pool
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
    console.log('✓ Server closed and PostgreSQL pool gracefully terminated\n');

    // =========================================================================
    // FINAL SUMMARY
    // =========================================================================
    console.log('================================================================================');
    console.log(`   SECTION 12 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)   `);
    console.log('================================================================================\n');

    if (failedTests.length > 0) {
      console.error('Failed Tests Breakdown:');
      failedTests.forEach((f) => {
        console.error(`  - Test ${f.index}: ${f.message} (${f.detail})`);
      });
      process.exit(1);
    } else {
      console.log('🎉 ALL SECTION 12 FINAL MASTER INTEGRATION TESTS PASSED 100%!\n');
      process.exit(0);
    }
  }
}

runSection12MasterVerification();
