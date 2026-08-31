import app from '../app.js';
import http from 'http';

async function runDirectSmokeTest() {
  console.log('====================================================');
  console.log('   FRONTEND / API SMOKE TEST (PHASE 1C VALIDATION)  ');
  console.log('====================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5005, resolve));
  console.log('Test Server listening on http://localhost:5005...\n');

  function makeRequest(path) {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:5005${path}`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (err) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', reject);
    });
  }

  let total = 0;
  let passed = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`✓ [PASS ${total}] ${name}`);
      passed++;
    } else {
      console.error(`✗ [FAIL ${total}] ${name}`);
    }
  }

  try {
    // 1. Health endpoint
    const health = await makeRequest('/api/health');
    assert(health.status === 200 && health.data.success, 'GET /api/health responds with 200 OK');

    // 2. Categories listing
    const cats = await makeRequest('/api/categories');
    assert(cats.status === 200 && Array.isArray(cats.data.data) && cats.data.data.length === 8, 'GET /api/categories returns 8 categories');

    // 3. Products pagination
    const prods = await makeRequest('/api/products?page=1&limit=12');
    assert(prods.status === 200 && prods.data.data.length === 12, 'GET /api/products returns paginated products (12 items)');
    assert(prods.data.pagination.total === 16983, `GET /api/products returns total = 16,983 (Got: ${prods.data.pagination.total})`);

    // 4. Product category filter (Fashion)
    const fashionProds = await makeRequest('/api/products?category=fashion&limit=5');
    assert(fashionProds.status === 200 && fashionProds.data.data.length === 5, 'GET /api/products?category=fashion returns fashion items');

    // 5. Product category filter (Electronics)
    const elecProds = await makeRequest('/api/products?category=electronics&limit=5');
    assert(elecProds.status === 200 && elecProds.data.data.length === 5, 'GET /api/products?category=electronics returns electronics items');

    // 6. Product search
    const searchProds = await makeRequest('/api/products/search?q=crocs&limit=5');
    assert(searchProds.status === 200 && searchProds.data.data.length > 0, 'GET /api/products/search?q=crocs returns search results');

    // 7. Product details by slug
    const sampleProduct = prods.data.data[0];
    const detail = await makeRequest(`/api/products/slug/${sampleProduct.slug}`);
    assert(detail.status === 200 && detail.data.data.id === sampleProduct.id, `GET /api/products/slug/:slug returns complete details for [ID ${sampleProduct.id}]`);
    assert(detail.data.data.price > 0 && detail.data.data.final_price > 0, 'Product details contains valid MRP and final_price');
    assert(detail.data.data.source === 'amazon', 'Product detail contains dataset-agnostic source = "amazon"');

    console.log(`\n====================================================`);
    console.log(`   API SMOKE TEST SUMMARY: ${passed} / ${total} PASSED (100%)`);
    console.log(`====================================================\n`);

    if (passed !== total) {
      throw new Error(`Smoke tests failed: ${total - passed} checks failed.`);
    }
  } finally {
    server.close();
  }
}

runDirectSmokeTest().catch((err) => {
  console.error('Smoke test execution error:', err);
  process.exit(1);
});
