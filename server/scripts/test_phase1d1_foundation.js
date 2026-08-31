import app from '../app.js';
import http from 'http';

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

async function runTestBed() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 1D.1: BACKEND & API FOUNDATION TEST SUITE       ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  const PORT = 5010;
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

  try {
    // 1. Health Endpoint
    const health = await request(PORT, '/api/health');
    assert(health.status === 200 && health.body.success, 'GET /api/health returns 200 OK');

    // 2. Categories List
    const cats = await request(PORT, '/api/categories');
    assert(cats.status === 200 && cats.body.data.length === 8, 'GET /api/categories returns 8 categories');

    // 3. Category Details by Slug
    const catDetail = await request(PORT, '/api/categories/fashion');
    assert(catDetail.status === 200 && catDetail.body.data.slug === 'fashion', 'GET /api/categories/fashion returns category details');

    // 4. Category Details 404
    const cat404 = await request(PORT, '/api/categories/non-existent-cat');
    assert(cat404.status === 404 && cat404.body.success === false, 'GET /api/categories/:invalid returns 404 Not Found');

    // 5. Default Products List & Pagination
    const prods = await request(PORT, '/api/products');
    assert(prods.status === 200 && prods.body.data.length === 12 && prods.body.pagination.total === 16976, 'GET /api/products returns default 12 items & total = 16,976');
    assert(prods.body.data[0].id && prods.body.data[0].name && prods.body.data[0].final_price, 'Product contains id, name, final_price');
    assert(prods.body.data[0].source === 'amazon', 'Product contains dataset-agnostic source');

    // 6. Custom Pagination & Sorting (price_asc)
    const prodsAsc = await request(PORT, '/api/products?page=2&limit=5&sort=price_asc');
    assert(prodsAsc.status === 200 && prodsAsc.body.data.length === 5 && prodsAsc.body.pagination.page === 2, 'GET /api/products?page=2&limit=5&sort=price_asc handles pagination');
    const p1Price = parseFloat(prodsAsc.body.data[0].final_price);
    const p2Price = parseFloat(prodsAsc.body.data[1].final_price);
    assert(p1Price <= p2Price, `Price sorting verified (Item 1: ₹${p1Price} <= Item 2: ₹${p2Price})`);

    // 7. Category & Price Range Filter
    const filterRes = await request(PORT, '/api/products?category=electronics&minPrice=1000&maxPrice=10000');
    assert(filterRes.status === 200 && filterRes.body.data.length > 0, 'GET /api/products?category=electronics&minPrice=1000&maxPrice=10000 filters correctly');
    const allInPriceRange = filterRes.body.data.every(p => parseFloat(p.final_price) >= 1000 && parseFloat(p.final_price) <= 10000);
    assert(allInPriceRange, 'All returned items satisfy the price range bounds [1000, 10000]');

    // 8. Rating Filter
    const ratingRes = await request(PORT, '/api/products?rating=4.5');
    assert(ratingRes.status === 200 && ratingRes.body.data.length > 0, 'GET /api/products?rating=4.5 returns highly rated items');
    const allHighRating = ratingRes.body.data.every(p => parseFloat(p.rating) >= 4.5);
    assert(allHighRating, 'All returned items satisfy rating >= 4.5');

    // 9. Full-Text Search (tsvector)
    const searchRes = await request(PORT, '/api/products/search?q=crocs');
    assert(searchRes.status === 200 && searchRes.body.data.length > 0, 'GET /api/products/search?q=crocs returns full-text search results');
    assert(searchRes.body.query === 'crocs', 'Search response echoes back search query');

    // 10. Search Validation Error (Missing q)
    const emptySearch = await request(PORT, '/api/products/search');
    assert(emptySearch.status === 422 && emptySearch.body.success === false, 'GET /api/products/search without q returns 422 Unprocessable Entity');

    // 11. Fetch by Integer ID
    const sampleId = prods.body.data[0].id;
    const byId = await request(PORT, `/api/products/${sampleId}`);
    assert(byId.status === 200 && byId.body.data.id === sampleId, `GET /api/products/:id returns product [ID ${sampleId}]`);

    // 12. Invalid Non-Numeric ID Handling
    const badId = await request(PORT, '/api/products/abc-not-an-id');
    assert(badId.status === 400 && badId.body.success === false, 'GET /api/products/abc returns 400 Bad Request');

    // 13. Non-Existent Product ID (404)
    const missingId = await request(PORT, '/api/products/99999999');
    assert(missingId.status === 404 && missingId.body.success === false, 'GET /api/products/99999999 returns 404 Not Found');

    // 14. Fetch by Slug
    const sampleSlug = prods.body.data[0].slug;
    const bySlug = await request(PORT, `/api/products/slug/${sampleSlug}`);
    assert(bySlug.status === 200 && bySlug.body.data.slug === sampleSlug, `GET /api/products/slug/:slug returns details and reviews`);

    // 15. Invalid Query Parameter Validation (minPrice > maxPrice)
    const badRange = await request(PORT, '/api/products?minPrice=5000&maxPrice=100');
    assert(badRange.status === 422 && badRange.body.success === false, 'GET /api/products with minPrice > maxPrice returns 422');

    // 16. Invalid Sort Parameter Validation
    const badSort = await request(PORT, '/api/products?sort=random_hack');
    assert(badSort.status === 422 && badSort.body.success === false, 'GET /api/products with invalid sort returns 422');

    // 17. Distinct Brands Listing
    const brands = await request(PORT, '/api/products/brands?category=fashion');
    assert(brands.status === 200 && Array.isArray(brands.body.data) && brands.body.data.length > 0, 'GET /api/products/brands returns brand list');

    // 18. Authentication & RBAC Foundation (Admin Login)
    const adminLogin = await request(PORT, '/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@cartify.com', password: 'AdminPassword123!' },
    });
    assert(adminLogin.status === 200 && adminLogin.body.data.token && adminLogin.body.data.user.role === 'ADMIN', 'POST /api/auth/login succeeds and assigns role ADMIN');

    // 19. Content Manager Login
    const cmLogin = await request(PORT, '/api/auth/login', {
      method: 'POST',
      body: { email: 'manager@cartify.com', password: 'ManagerPassword123!' },
    });
    assert(cmLogin.status === 200 && cmLogin.body.data.user.role === 'CONTENT_MANAGER', 'POST /api/auth/login succeeds for CONTENT_MANAGER');

    // 20. Invalid Password Rejection
    const badLogin = await request(PORT, '/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@cartify.com', password: 'WrongPassword!' },
    });
    assert(badLogin.status === 401 && badLogin.body.success === false, 'POST /api/auth/login with wrong password returns 401 Unauthorized');

    console.log(`\n================================================================`);
    console.log(`   PHASE 1D.1 FOUNDATION SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`================================================================\n`);

    if (passed !== total) {
      throw new Error(`Test suite failed: ${total - passed} tests failed.`);
    }
  } finally {
    server.close();
  }
}

runTestBed().catch((err) => {
  console.error('Test bed error:', err);
  process.exit(1);
});
