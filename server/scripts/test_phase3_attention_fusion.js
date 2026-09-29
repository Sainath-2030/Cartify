import http from 'http';
import assert from 'assert';
import app from '../app.js';
import { signToken } from '../utils/jwt.js';

function request(server, method, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `http://localhost:${server.address().port}`);
    const req = http.request(url, { method, headers }, (res) => {
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
    req.end();
  });
}

async function runFusionTests() {
  console.log('================================================================');
  console.log('   CARTIFY PHASE 3: ATTENTION FUSION LAYER VERIFICATION SUITE   ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Ephemeral Test Server listening on port ${port}`);

  try {
    const adminToken = signToken({ id: 1, email: 'admin@cartify.com', role: 'ADMIN' });
    const userToken = signToken({ id: 2, email: 'shopper@cartify.com', role: 'USER' });

    // 1. Unauthenticated request rejected
    const unauthRes = await request(server, 'GET', '/api/admin/models/fusion-recommendations');
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request returns 401');
    console.log('✓ [PASS 1] GET /api/admin/models/fusion-recommendations without token returns 401');

    // 2. Non-admin request rejected
    const userRes = await request(server, 'GET', '/api/admin/models/fusion-recommendations', {
      Authorization: `Bearer ${userToken}`,
    });
    assert.strictEqual(userRes.status, 403, 'Non-admin request returns 403');
    console.log('✓ [PASS 2] Non-admin USER role accessing fusion endpoint returns 403 Forbidden');

    // 3. Status endpoint shows 5 active models
    const statusRes = await request(server, 'GET', '/api/admin/models/status', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(statusRes.status, 200, 'Model status returns 200');
    assert.strictEqual(statusRes.body.data.activeModelCount, 5, 'Active model count is 5');
    assert.strictEqual(statusRes.body.data.totalModels, 5, 'Total model count is 5');

    const fusionInfo = statusRes.body.data.fusionDetails;
    assert.ok(fusionInfo, 'fusionDetails exists');
    assert.strictEqual(fusionInfo.status, 'ACTIVE', 'Fusion status is ACTIVE');
    assert.strictEqual(fusionInfo.version, 'v1.0.0-trained', 'Fusion version is v1.0.0-trained');
    console.log('✓ [PASS 3] Model status reports all 5 models online with Attention Fusion ACTIVE (v1.0.0-trained)');

    // 4. Fusion recommendations query
    const recsRes = await request(server, 'GET', '/api/admin/models/fusion-recommendations?userId=1&topK=4', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(recsRes.status, 200, 'Fusion recommendations returns 200');
    const data = recsRes.body;
    assert.strictEqual(data.success, true, 'Response success is true');
    assert.strictEqual(data.userId, 1, 'userId is 1');
    assert.strictEqual(data.recommendations.length, 4, 'Returned 4 recommendations');

    // Verify recommendations structure and attention weights
    const topRec = data.recommendations[0];
    assert.ok(topRec.productId, 'Recommendation has productId');
    assert.ok(topRec.name, 'Recommendation has product name');
    assert.ok(topRec.affinityPercentage > 0, 'Recommendation has affinity percentage');
    assert.ok(topRec.dominantModality, 'Recommendation specifies dominantModality');
    assert.ok(topRec.attentionWeights, 'Recommendation has attentionWeights');
    assert.ok('ncf' in topRec.attentionWeights, 'attentionWeights contains ncf');
    assert.ok('cnn' in topRec.attentionWeights, 'attentionWeights contains cnn');
    assert.ok('gru' in topRec.attentionWeights, 'attentionWeights contains gru');
    assert.ok('autoencoder' in topRec.attentionWeights, 'attentionWeights contains autoencoder');

    console.log(`✓ [PASS 4] GET /api/admin/models/fusion-recommendations returned Top 4 items with attention weights`);
    console.log(`          Rank #1: ${topRec.name} (Dominant: ${topRec.dominantModality}, Score: ${topRec.affinityPercentage}%)`);

    // 5. Aggregate attention weights and explanation
    assert.ok(data.aggregateAttentionWeights, 'aggregateAttentionWeights exists');
    const totalWeight = Object.values(data.aggregateAttentionWeights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(totalWeight - 1.0) < 0.05, `Aggregate attention weights sum to ~1.0 (got ${totalWeight})`);
    assert.ok(data.explanation && data.explanation.length > 0, 'Explanation string present');
    console.log(`✓ [PASS 5] Multi-modal attention weights dynamically sum to 1.0 (${JSON.stringify(data.aggregateAttentionWeights)})`);
    console.log(`          Reasoning: "${data.explanation}"`);

    console.log('================================================================');
    console.log('   ALL ATTENTION FUSION VERIFICATION TESTS PASSED (5/5)         ');
    console.log('================================================================\n');
    process.exit(0);
  } finally {
    server.close();
  }
}

runFusionTests().catch((err) => {
  console.error('Test Suite Failure:', err);
  process.exit(1);
});
