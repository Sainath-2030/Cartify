/**
 * dump_mining_results.js
 * ---------------------------------------------------------------------------
 * Reproduces the instance-level mining results reported in Section V of
 * cartify_ieee.tex (Apriori basket rules, RFM cluster profiles, churn tiers)
 * and writes them to paper/mining_results.json.
 *
 * The static configuration values in Tables RFM and CHURN RULES of the paper
 * are read directly from the service implementations and need no database.
 * Only the *instances* -- the actual rules mined, the realised cluster sizes,
 * and the per-customer churn assignments -- depend on a populated store, and
 * that is what this script collects.
 *
 * USAGE
 *   cd server
 *   node ../paper/dump_mining_results.js
 *
 * Requires:
 *   - a running PostgreSQL instance reachable via server/.env DATABASE_URL
 *   - the operational schema applied (users, orders, order_items, products,
 *     cart_items, reviews, interactions)
 *   - at least two multi-item orders for basket mining to yield any rules
 *
 * The script is READ-ONLY with respect to the database: it calls service
 * methods that only issue SELECT queries and writes nothing back.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { aprioriService } from '../server/services/mining/aprioriService.js';
import { kmeansService } from '../server/services/mining/kmeansService.js';
import { churnService } from '../server/services/mining/churnService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, 'mining_results.json');

/**
 * Mining thresholds. These mirror the service defaults and are recorded in the
 * output so the paper's reported rules can always be traced to the parameters
 * that produced them.
 */
const APRIORI_PARAMS = {
  minSupport: 0.01,
  minConfidence: 0.2,
  minLift: 1.0,
  maxItemsetSize: 2, // implementation caps candidate generation at 2-itemsets
};

const KMEANS_PARAMS = {
  k: 4,
  maxIterations: 100,
  distance: 'euclidean',
  scaling: 'min-max per RFM axis',
  initialisation: 'semantic (hand-specified centroid positions)',
};

async function main() {
  console.log('Cartify mining results dump');
  console.log('==========================');
  console.log(`Output: ${OUT_PATH}\n`);

  const output = {
    generatedAt: new Date().toISOString(),
    note:
      'Instance-level outputs of the classical miners described in ' +
      'Section V of cartify_ieee.tex. Static configuration (thresholds, ' +
      'centroid coordinates, logistic coefficients, rule conditions) is ' +
      'documented in the paper directly from the service implementations.',
    apriori: null,
    kmeans: null,
    churn: null,
    errors: [],
  };

  // --- Apriori -----------------------------------------------------------
  console.log('[1/3] Mining Apriori association rules...');
  try {
    const rules = await aprioriService.mineAssociationRules(APRIORI_PARAMS);
    output.apriori = {
      parameters: APRIORI_PARAMS,
      ruleCount: rules.length,
      // Top 10 by lift (the service already sorts by lift, then confidence)
      topRulesByLift: rules.slice(0, 10).map((r) => ({
        antecedent: r.antecedentNames ?? r.antecedent,
        consequent: r.consequentNames ?? r.consequent,
        support: r.support,
        confidence: r.confidence,
        lift: r.lift,
      })),
    };
    console.log(`      -> ${rules.length} rules passed the thresholds.`);
  } catch (err) {
    console.error(`      -> FAILED: ${err.message}`);
    output.errors.push({ stage: 'apriori', message: err.message });
  }

  // --- K-Means / RFM -----------------------------------------------------
  console.log('[2/3] Clustering customers on RFM vectors...');
  try {
    const result = await kmeansService.clusterCustomers();
    output.kmeans = {
      parameters: KMEANS_PARAMS,
      centroids: result.centroids,
      clusters: result.clusters.map((c) => ({
        id: c.id,
        label: c.label,
        customerCount: c.customerCount,
        averageRecency: c.averageRecency,
        averageFrequency: c.averageFrequency,
        averageMonetary: c.averageMonetary,
        averageOrderValue: c.averageOrderValue,
      })),
    };
    const total = result.clusters.reduce((s, c) => s + c.customerCount, 0);
    console.log(`      -> ${result.clusters.length} clusters over ${total} customers.`);
  } catch (err) {
    console.error(`      -> FAILED: ${err.message}`);
    output.errors.push({ stage: 'kmeans', message: err.message });
  }

  // --- Churn -------------------------------------------------------------
  console.log('[3/3] Scoring churn risk...');
  try {
    const result = await churnService.predictChurn({ limit: 1000 });
    output.churn = {
      summary: result.summary,
      // NB: decisionTreeRules[].confidence / .support are author-configured
      // design parameters, NOT measured frequencies. They are excluded here
      // so they cannot be mistaken for empirical results.
      predictions: result.predictions.map((p) => ({
        customerId: p.customerId,
        churnProbability: p.churnProbability,
        riskLevel: p.riskLevel,
        matchedRuleId: p.matchedRule?.ruleId ?? null,
        primaryRiskDriver: p.primaryRiskDriver,
      })),
      ruleConditions: result.decisionTreeRules.map((r) => ({
        id: r.id,
        condition: r.condition,
        outcome: r.outcome,
      })),
    };
    const s = result.summary;
    console.log(
      `      -> ${s.totalAnalyzed} analysed: ${s.highRiskCount} high, ` +
        `${s.mediumRiskCount} medium, ${s.safeCount} safe.`
    );
  } catch (err) {
    console.error(`      -> FAILED: ${err.message}`);
    output.errors.push({ stage: 'churn', message: err.message });
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nWrote ${OUT_PATH}`);

  if (output.errors.length > 0) {
    console.log('\nOne or more stages failed. The JSON records the errors under');
    console.log('an "errors" key; the remaining stages are still valid.');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});