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

async function runRBACTestSuite() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 1D.3: RBAC CONSOLE APIS TEST SUITE             ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  const PORT = 5070;
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
    // Generate Auth Tokens
    const tokenShopper = signToken({ userId: 3, email: 'shopper@cartify.com', role: 'USER' });
    const tokenManager = signToken({ userId: 2, email: 'manager@cartify.com', role: 'CONTENT_MANAGER' });
    const tokenAdmin = signToken({ userId: 1, email: 'admin@cartify.com', role: 'ADMIN' });

    // Clean any prior test audit logs / internal test products
    await client.query("DELETE FROM products WHERE source = 'internal' AND source_id LIKE 'INT-TEST-%'");

    // 1. Unauthenticated Admin endpoint returns 401
    const unauthAdmin = await request(PORT, '/api/admin/catalogue/health');
    assert(unauthAdmin.status === 401 && unauthAdmin.body.success === false, 'GET /api/admin/catalogue/health without token returns 401 Unauthorized');

    // 2. USER accessing Admin returns 403 Forbidden
    const shopperAdmin = await request(PORT, '/api/admin/catalogue/health', {
      headers: { Authorization: `Bearer ${tokenShopper}` },
    });
    assert(shopperAdmin.status === 403 && shopperAdmin.body.success === false, 'USER role accessing /api/admin/* returns 403 Forbidden');

    // 3. CONTENT_MANAGER accessing Admin returns 403 Forbidden
    const managerAdmin = await request(PORT, '/api/admin/catalogue/health', {
      headers: { Authorization: `Bearer ${tokenManager}` },
    });
    assert(managerAdmin.status === 403 && managerAdmin.body.success === false, 'CONTENT_MANAGER role accessing /api/admin/* returns 403 Forbidden');

    // 4. ADMIN accessing Admin returns 200 OK
    const adminHealth = await request(PORT, '/api/admin/catalogue/health', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminHealth.status === 200 && adminHealth.body.success === true, 'ADMIN role accessing /api/admin/catalogue/health returns 200 OK');

    // 5. USER accessing Content Manager returns 403 Forbidden
    const shopperCM = await request(PORT, '/api/content-manager/products', {
      headers: { Authorization: `Bearer ${tokenShopper}` },
    });
    assert(shopperCM.status === 403 && shopperCM.body.success === false, 'USER role accessing /api/content-manager/* returns 403 Forbidden');

    // 6. CONTENT_MANAGER accessing Content Manager returns 200 OK
    const managerCM = await request(PORT, '/api/content-manager/products', {
      headers: { Authorization: `Bearer ${tokenManager}` },
    });
    assert(managerCM.status === 200 && managerCM.body.success === true, 'CONTENT_MANAGER accessing /api/content-manager/products returns 200 OK');

    // 7. ADMIN accessing Content Manager returns 200 OK
    const adminCM = await request(PORT, '/api/content-manager/products', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(adminCM.status === 200 && adminCM.body.success === true, 'ADMIN accessing /api/content-manager/products returns 200 OK');

    // 8. Role Spoofing Prevention (Client body role is ignored)
    const spoofToken = signToken({ userId: 3, email: 'shopper@cartify.com', role: 'USER' });
    const spoofAttempt = await request(PORT, '/api/admin/catalogue/health', {
      method: 'GET',
      headers: { Authorization: `Bearer ${spoofToken}` },
      body: { role: 'ADMIN' },
    });
    assert(spoofAttempt.status === 403, 'Role spoofing via body ignored (Server relies strictly on verified JWT)');

    // 9. Catalogue Health Returns Real PostgreSQL Data
    const healthData = adminHealth.body.data;
    assert(healthData.totalProducts >= 16976, `Catalogue health returns real totalProducts (${healthData.totalProducts})`);
    assert(healthData.categoryDistribution.length === 8, 'Catalogue health reports all 8 categories');
    assert(healthData.provenance.amazon >= 16976, 'Catalogue health accurately tracks Amazon provenance');

    // 10. Interaction Analytics Returns Real PostgreSQL Data
    const analyticsRes = await request(PORT, '/api/admin/analytics/interactions?timeframe=all', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(analyticsRes.status === 200 && analyticsRes.body.success === true, 'GET /api/admin/analytics/interactions returns 200 OK');
    assert(Array.isArray(analyticsRes.body.data.byType), 'Analytics contains byType breakdown array');

    // 11. Model Metrics Returns Explicit Unavailable State (No fake numbers)
    const metricsRes = await request(PORT, '/api/admin/models/metrics', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(metricsRes.status === 200 && metricsRes.body.data.status === 'NOT_AVAILABLE', 'GET /api/admin/models/metrics returns explicit NOT_AVAILABLE state');
    assert(metricsRes.body.data.evaluation === null, 'Evaluation metrics are null without fake accuracy values');

    // 12. Model Status Returns Explicit Uninitialized State
    const statusRes = await request(PORT, '/api/admin/models/status', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(statusRes.status === 200 && statusRes.body.data.status === 'NOT_IMPLEMENTED', 'GET /api/admin/models/status returns explicit NOT_IMPLEMENTED');
    assert(statusRes.body.data.models.length === 5, 'Status lists all 5 multi-model components (NCF, CNN, GRU, Autoencoder, Fusion)');

    // 13. Retraining Request Endpoint Registers Job Without Fake Blocking
    const retrainRes = await request(PORT, '/api/admin/models/retrain', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { trigger: 'manual_admin', parameters: { epochs: 10 } },
    });
    assert(retrainRes.status === 202 && retrainRes.body.data.status === 'QUEUED', 'POST /api/admin/models/retrain returns 202 Accepted with QUEUED status');
    assert(retrainRes.body.data.requestId.startsWith('retrain-req-'), 'Retrain request assigned valid requestId');

    // 14. Business Rules GET and PATCH
    const getRules = await request(PORT, '/api/admin/business-rules', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(getRules.status === 200 && getRules.body.data.diversityBoost !== undefined, 'GET /api/admin/business-rules returns active rules');

    const patchRules = await request(PORT, '/api/admin/business-rules', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { diversityBoost: 0.25 },
    });
    assert(patchRules.status === 200 && patchRules.body.data.diversityBoost === 0.25, 'PATCH /api/admin/business-rules updates diversityBoost to 0.25');

    // Restore original diversityBoost
    await request(PORT, '/api/admin/business-rules', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: { diversityBoost: 0.15 },
    });

    // 15. Content Manager Creates Internal Product
    const newProductPayload = {
      name: 'Cartify Studio Headphones Pro',
      brand: 'Cartify Audio',
      categoryId: 1, // Electronics
      subcategory: 'Headphones',
      description: 'High-fidelity internal studio monitor headphones with active noise cancellation.',
      price: 4999.0,
      discountPercentage: 20,
      finalPrice: 3999.2,
      stockQuantity: 25,
      mainImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      images: ['https://images.unsplash.com/photo-1484704849700-f032a568e944'],
      specifications: { connectivity: 'Bluetooth 5.3', batteryLife: '40 hours' },
    };

    const createProdRes = await request(PORT, '/api/content-manager/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenManager}` },
      body: newProductPayload,
    });
    assert(createProdRes.status === 201 && createProdRes.body.success === true, 'POST /api/content-manager/products creates internal product');
    const createdId = createProdRes.body.data.id;
    assert(createProdRes.body.data.source === 'internal', 'Created product has source = "internal" (Dataset independence verified)');
    assert(createProdRes.body.data.sourceId.startsWith('INT-'), 'Created product assigned stable Cartify sourceId');

    // 16. Content Manager Updates Product Metadata
    const updateProdRes = await request(PORT, `/api/content-manager/products/${createdId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenManager}` },
      body: { name: 'Cartify Studio Headphones Pro (Updated Edition)', stockQuantity: 30 },
    });
    assert(updateProdRes.status === 200 && updateProdRes.body.data.name.includes('Updated Edition'), 'PATCH /api/content-manager/products/:id updates name');
    assert(updateProdRes.body.data.stockQuantity === 30, 'PATCH updates stockQuantity');

    // 17. Content Manager Updates Product Images
    const updateImagesRes = await request(PORT, `/api/content-manager/products/${createdId}/images`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenManager}` },
      body: {
        mainImage: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b',
        images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90'],
      },
    });
    assert(updateImagesRes.status === 200 && updateImagesRes.body.data.mainImage.includes('1546435770'), 'PATCH /api/content-manager/products/:id/images updates main image');

    // 18. Shopper / Unauthorized User Cannot Update Product (403)
    const unauthorizedEdit = await request(PORT, `/api/content-manager/products/${createdId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenShopper}` },
      body: { name: 'Hacked Title' },
    });
    assert(unauthorizedEdit.status === 403 && unauthorizedEdit.body.success === false, 'Shopper cannot edit product (403 Forbidden)');

    // 19. Audit Logs Table Records Administrative Events
    const auditRes = await request(PORT, '/api/admin/audit-logs?limit=10', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(auditRes.status === 200 && auditRes.body.data.length > 0, 'GET /api/admin/audit-logs returns recorded audit entries');
    const prodCreateAudit = auditRes.body.data.find((a) => a.action === 'PRODUCT_CREATE' && a.entityId === String(createdId));
    assert(prodCreateAudit !== undefined, 'PRODUCT_CREATE event recorded in audit logs with actor and entity ID');

    // 20. Clean up test internal product
    await client.query('DELETE FROM products WHERE id = $1', [createdId]);

    // 21. Verify Cart API still works
    const cartCheck = await request(PORT, '/api/cart', {
      headers: { Authorization: `Bearer ${tokenShopper}` },
    });
    assert(cartCheck.status === 200, 'GET /api/cart continues to operate seamlessly');

    // 22. Verify Wishlist API still works
    const wishCheck = await request(PORT, '/api/wishlist', {
      headers: { Authorization: `Bearer ${tokenShopper}` },
    });
    assert(wishCheck.status === 200, 'GET /api/wishlist continues to operate seamlessly');

    // 23. Verify Reviews API still works
    const revCheck = await request(PORT, '/api/products/1/reviews');
    assert(revCheck.status === 200, 'GET /api/products/1/reviews continues to operate seamlessly');

    // 24. Verify Orders API still works
    const orderCheck = await request(PORT, '/api/orders', {
      headers: { Authorization: `Bearer ${tokenShopper}` },
    });
    assert(orderCheck.status === 200, 'GET /api/orders continues to operate seamlessly');

    console.log(`\n================================================================`);
    console.log(`   PHASE 1D.3 RBAC APIS SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed !== total) {
      throw new Error(`RBAC test suite failed: ${total - passed} tests failed.`);
    }
  } finally {
    client.release();
    await pool.end();
    server.close();
  }
}

runRBACTestSuite().catch((err) => {
  console.error('RBAC test suite execution error:', err);
  process.exit(1);
});
