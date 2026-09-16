import http from 'http';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../app.js';
import { signToken } from '../utils/jwt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function runSection11Tests() {
  console.log('================================================================');
  console.log('   SECTION 11: ADMIN ANALYTICS & MONITORING VERIFICATION SUITE   ');
  console.log('================================================================\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Ephemeral Test Server listening on port ${port}\n`);

  try {
    const adminToken = signToken({ id: 1, email: 'admin@cartify.com', role: 'ADMIN' });
    const userToken = signToken({ id: 2, email: 'shopper@cartify.com', role: 'USER' });

    // 1. RBAC Boundary Verification
    console.log('--- TEST 1: RBAC Boundary Protection for Admin Analytics ---');
    const unauthRes = await request(server, 'GET', '/api/admin/models/metrics');
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401');

    const forbiddenRes = await request(server, 'GET', '/api/admin/models/metrics', {
      Authorization: `Bearer ${userToken}`,
    });
    assert.strictEqual(forbiddenRes.status, 403, 'Non-admin user role must return 403 Forbidden');
    console.log('✓ [PASS 1] Admin analytics endpoints strictly enforce 401 and 403 RBAC boundaries.');

    // 2. Model Evaluation Metrics Contract
    console.log('\n--- TEST 2: Multi-Model Evaluation Metrics & Benchmarks ---');
    const metricsRes = await request(server, 'GET', '/api/admin/models/metrics', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(metricsRes.status, 200, 'Metrics endpoint should return 200');
    assert.strictEqual(metricsRes.body.success, true, 'Success flag should be true');
    const mData = metricsRes.body.data;
    assert.strictEqual(mData.status, 'AVAILABLE', 'Model status should be AVAILABLE');
    assert.ok(mData.evaluation, 'Should include evaluation object');
    assert.ok(mData.evaluation.hitRateAt10 !== undefined, 'Should include hitRateAt10');
    assert.ok(mData.evaluation.ndcgAt10 !== undefined, 'Should include ndcgAt10');
    assert.ok(mData.evaluation.precisionAt10 !== undefined, 'Should include precisionAt10');
    assert.ok(mData.evaluation.mrr !== undefined, 'Should include mrr');
    assert.ok(mData.evaluation.catalogueCoveragePercent !== undefined, 'Should include catalogueCoveragePercent');
    assert.ok(mData.models.fusion, 'Should include fusion model evaluation');
    assert.ok(mData.models.ncf, 'Should include NCF model evaluation');
    assert.ok(mData.models.gru, 'Should include GRU model evaluation');
    assert.ok(mData.models.autoencoder, 'Should include Autoencoder model evaluation');
    assert.ok(mData.models.cnn, 'Should include CNN model evaluation');
    console.log(`✓ [PASS 2] Returned comprehensive multi-model evaluation benchmarks:`);
    console.log(`          Fusion HR@10: ${(mData.evaluation.hitRateAt10 * 100).toFixed(2)}% | NDCG@10: ${mData.evaluation.ndcgAt10.toFixed(4)} | MRR: ${mData.evaluation.mrr.toFixed(4)} | Coverage: ${mData.evaluation.catalogueCoveragePercent.toFixed(1)}%`);

    // 3. Interaction Telemetry Analytics & Timeline
    console.log('\n--- TEST 3: Interaction Telemetry Analytics & Timeline Breakdown ---');
    const analyticsRes = await request(server, 'GET', '/api/admin/analytics/interactions?timeframe=all', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(analyticsRes.status, 200, 'Interaction analytics should return 200');
    assert.strictEqual(analyticsRes.body.success, true, 'Success flag should be true');
    const aData = analyticsRes.body.data;
    assert.ok(aData.totalEvents > 0, 'Total events should be greater than 0');
    assert.ok(aData.uniqueUsers > 0, 'Unique users should be greater than 0');
    assert.ok(Array.isArray(aData.byType), 'byType should be an array');
    assert.ok(Array.isArray(aData.timeline), 'timeline should be an array');
    console.log(`✓ [PASS 3] Telemetry verified: ${aData.totalEvents} events, ${aData.uniqueUsers} shoppers across ${aData.byType.length} event types.`);

    // 4. Telemetry Conversion Funnel API
    console.log('\n--- TEST 4: E-Commerce Conversion Funnel Analytics ---');
    const funnelRes = await request(server, 'GET', '/api/admin/analytics/funnel?timeframe=all', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(funnelRes.status, 200, 'Funnel endpoint should return 200');
    assert.strictEqual(funnelRes.body.success, true, 'Success flag should be true');
    const fData = funnelRes.body.data;
    assert.strictEqual(fData.stages.length, 3, 'Funnel should have 3 distinct stages');
    assert.strictEqual(fData.stages[0].interactionType, 'VIEW');
    assert.strictEqual(fData.stages[1].interactionType, 'INTENT');
    assert.strictEqual(fData.stages[2].interactionType, 'PURCHASE');
    assert.ok(fData.rates.viewToIntentRate >= 0, 'View to intent rate should be valid number');
    assert.ok(fData.rates.overallConversionRate >= 0, 'Overall conversion rate should be valid number');
    console.log(`✓ [PASS 4] Funnel verified:`);
    console.log(`          Stage 1 (${fData.stages[0].stage}): ${fData.stages[0].events} views`);
    console.log(`          Stage 2 (${fData.stages[1].stage}): ${fData.stages[1].events} intent actions (${fData.rates.viewToIntentRate}% retention)`);
    console.log(`          Stage 3 (${fData.stages[2].stage}): ${fData.stages[2].events} purchases (${fData.rates.overallConversionRate}% conversion)`);

    // 5. Model Evaluation Trigger API
    console.log('\n--- TEST 5: Live Trigger Offline Evaluation Benchmark ---');
    const evalTriggerRes = await request(server, 'POST', '/api/admin/models/evaluate', {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.strictEqual(evalTriggerRes.status, 200, 'Trigger evaluate should return 200');
    assert.strictEqual(evalTriggerRes.body.success, true, 'Success flag should be true');
    assert.ok(evalTriggerRes.body.data.models, 'Should return models evaluation dictionary');
    console.log(`✓ [PASS 5] Live model evaluation benchmark triggered, executed, and returned successfully.`);

    // 6. Artifact Persistence Verification
    console.log('\n--- TEST 6: Model Evaluation Metrics Artifact Verification ---');
    const artifactPath = path.resolve(__dirname, '../../ml-service/artifacts/model_evaluation_metrics.json');
    assert.ok(fs.existsSync(artifactPath), 'model_evaluation_metrics.json must exist');
    const artifactContent = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    assert.ok(artifactContent.models.fusion, 'Artifact must contain fusion evaluation');
    assert.ok(artifactContent.evaluatedAt, 'Artifact must have evaluatedAt timestamp');
    console.log(`✓ [PASS 6] Verified persisted artifact at ${artifactPath}`);

    console.log('\n================================================================');
    console.log('   ALL 6 SECTION 11 TEST SUITES PASSED (100% VERIFIED)          ');
    console.log('================================================================\n');
    process.exit(0);
  } finally {
    server.close();
  }
}

runSection11Tests().catch((err) => {
  console.error('\n❌ SECTION 11 VERIFICATION SUITE FAILED:\n', err);
  process.exit(1);
});
