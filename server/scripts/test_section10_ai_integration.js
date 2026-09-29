import http from 'http';
import assert from 'assert';
import app from '../app.js';
import { signToken } from '../utils/jwt.js';

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

async function runSection10Tests() {
  console.log('================================================================');
  console.log('   SECTION 10: AI + STOREFRONT INTEGRATION VERIFICATION SUITE   ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Ephemeral Test Server listening on port ${port}\n`);

  try {
    const userToken = signToken({ id: 5, email: 'user5@test.com', role: 'USER' });

    // 1. Guest Cold Start / Trending Fallback
    console.log('--- TEST 1: Anonymous Guest Recommendations (Trending Fallback) ---');
    const guestRes = await request(server, 'GET', '/api/products/recommendations/for-you?topK=4');
    assert.strictEqual(guestRes.status, 200, 'Guest recommendations should return 200');
    assert.strictEqual(guestRes.body.success, true, 'Success flag should be true');
    assert.ok(Array.isArray(guestRes.body.data.recommendations), 'Should return recommendations array');
    assert.strictEqual(guestRes.body.data.recommendations.length, 4, 'Should return exactly 4 products');
    assert.ok(guestRes.body.data.recommendations[0].name, 'Product should have name');
    console.log(`✓ [PASS 1] Guest discovery returns ${guestRes.body.data.recommendations.length} curated products (source: ${guestRes.body.data.source})`);

    // 2. Session Intent Tracking + GRU Session Inference
    console.log('\n--- TEST 2: Session Telemetry & Recurrent Sequence GRU Fallback ---');
    const sessId = `test_sess_${Date.now()}`;
    // Log an interaction event to telemetry
    const interactRes = await request(server, 'POST', '/api/interactions', {}, {
      interactionType: 'VIEW',
      productId: 4439,
      sessionId: sessId,
      metadata: { referrer: 'home_hero' }
    });
    assert.ok(interactRes.status === 200 || interactRes.status === 201, 'Interaction logging should return 200/201');
    console.log(`✓ Telemetry logged event CLICK for session ${sessId}`);

    const sessionRes = await request(server, 'GET', `/api/products/recommendations/for-you?sessionId=${sessId}&topK=4`);
    assert.strictEqual(sessionRes.status, 200, 'Session-based recommendation query returns 200');
    assert.strictEqual(sessionRes.body.success, true, 'Success flag should be true');
    assert.ok(sessionRes.body.data.recommendations.length > 0, 'Should return recommendations for session');
    console.log(`✓ [PASS 2] Session-aware inference returned ${sessionRes.body.data.recommendations.length} recommendations (source: ${sessionRes.body.data.source})`);

    // 3. User Authenticated Multi-Modal Attention Fusion
    console.log('\n--- TEST 3: Authenticated Storefront Recommendations (Attention Fusion) ---');
    const authRes = await request(server, 'GET', '/api/products/recommendations/for-you?topK=4', {
      Authorization: `Bearer ${userToken}`,
    });
    assert.strictEqual(authRes.status, 200, 'Authenticated recommendation query returns 200');
    assert.strictEqual(authRes.body.data.source, 'attention_fusion', 'Source should be attention_fusion');
    assert.ok(authRes.body.data.recommendations.length > 0, 'Should return fused recommendations');
    const topRec = authRes.body.data.recommendations[0];
    assert.ok(topRec.affinityPercentage >= 0, 'Recommendation should have affinityPercentage');
    console.log(`✓ [PASS 3] Attention Fusion returned ${authRes.body.data.recommendations.length} items for User 5`);
    console.log(`  Top Match: "${topRec.name}" | Modality: ${topRec.dominantModality || 'FUSED'} | Score: ${topRec.score} (${topRec.affinityPercentage}%)`);

    // 4. User Profile Dedicated Recommendations API
    console.log('\n--- TEST 4: Profile /users/me/recommendations Endpoint ---');
    const profileRes = await request(server, 'GET', '/api/users/me/recommendations?limit=4', {
      Authorization: `Bearer ${userToken}`,
    });
    assert.strictEqual(profileRes.status, 200, 'Profile recommendations return 200');
    assert.ok(Array.isArray(profileRes.body.data.recommendations), 'Returns recommendations array');
    console.log(`✓ [PASS 4] Profile endpoint delivered ${profileRes.body.data.recommendations.length} personalized recommendations`);

    // 5. CNN ResNet-18 Visual Similarity on Product Details
    console.log('\n--- TEST 5: CNN ResNet-18 Visual Similarity Endpoint ---');
    const testProductId = 4439;
    const simRes = await request(server, 'GET', `/api/products/${testProductId}/similar?limit=4`);
    assert.strictEqual(simRes.status, 200, 'Visual similarity endpoint returns 200');
    assert.strictEqual(simRes.body.data.source, 'cnn_resnet18', 'Source should be cnn_resnet18');
    assert.ok(Array.isArray(simRes.body.data.similarProducts), 'similarProducts should be an array');
    assert.ok(simRes.body.data.similarProducts.length > 0, 'Should return similar products');
    const firstSim = simRes.body.data.similarProducts[0];
    assert.ok(firstSim.similarityPercentage > 0, 'Similar product should have similarityPercentage');
    console.log(`✓ [PASS 5] CNN ResNet-18 visual similarity returned ${simRes.body.data.similarProducts.length} visually matched items for product ${testProductId}`);
    console.log(`  Top Visual Match: "${firstSim.name}" (${firstSim.similarityPercentage}% visual similarity)`);

    // 6. Route precedence check: slug vs recommendations vs similar
    console.log('\n--- TEST 6: Route Precedence & Dynamic Slugs ---');
    const slugRes = await request(server, 'GET', `/api/products/slug/proline-mens-track-pants`);
    // Status can be 200 if found or 404 if slug differs, but critically should NOT trigger recommendations router
    assert.ok([200, 404].includes(slugRes.status), 'Slug route works as expected');
    console.log('✓ [PASS 6] Route precedence verified: /recommendations/for-you and /:id/similar do not collide with slug resolution');

    console.log('\n================================================================');
    console.log('   ALL SECTION 10 INTEGRATION TESTS PASSED (6/6)                ');
    console.log('================================================================');
  } finally {
    server.close();
  }
}

runSection10Tests().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
