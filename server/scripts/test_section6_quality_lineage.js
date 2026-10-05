/**
 * Section 6: ETL Pipeline Monitoring, Data Lineage & Quality Auditing Test Suite
 * 
 * Validates:
 * 1. Schema Tables (etl_job_runs, etl_data_lineage, data_quality_audits)
 * 2. Automated Completeness Scoring (non-null rates across star schema dimensions & facts)
 * 3. Automated Consistency Scoring (referential integrity, orphan checks, math balances)
 * 4. Automated Timeliness Scoring (ingestion latency, freshness SLA evaluation)
 * 5. Composite Data Quality Index (DQI) formula weighting and status grading
 * 6. 4-Tier Architectural Data Lineage DAG generation & live node counts
 * 7. Quality audit persistence & retrieval via dataQualityService
 */

import { dataQualityService } from '../services/mining/dataQualityService.js';
import { warehouseService } from '../services/warehouseService.js';
import { query } from '../config/db.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runSection6Tests() {
  console.log('\n🛡️ === STARTING SECTION 6: ETL MONITORING, LINEAGE & DATA QUALITY TEST SUITE ===\n');

  try {
    // 1. Table Verification
    console.log('--- Test 1: Section 6 Physical Tables Verification ---');
    await dataQualityService.ensureTablesExist();

    const tables = ['etl_job_runs', 'etl_data_lineage', 'data_quality_audits'];
    for (const t of tables) {
      const res = await query(`SELECT count(*) FROM ${t}`);
      const count = parseInt(res.rows[0].count, 10);
      assert(count >= 0, `Table '${t}' exists and queryable (current rows = ${count})`);
    }

    // 2. Run Fresh Data Quality Audit
    console.log('\n--- Test 2: Automated Data Quality Audit Execution ---');
    const auditResult = await dataQualityService.runQualityAudit();
    assert(auditResult !== null && auditResult !== undefined, 'Data Quality audit executed successfully');
    assert(typeof auditResult.summary.overallScore === 'number', `Overall DQI Score calculated: ${auditResult.summary.overallScore}%`);
    assert(auditResult.summary.overallScore >= 0 && auditResult.summary.overallScore <= 100, 'Overall DQI is bounded in [0, 100]%');

    // 3. Completeness Verification
    console.log('\n--- Test 3: Completeness Metrics & Dimension Breakdown ---');
    assert(typeof auditResult.summary.completenessScore === 'number', `Completeness Score: ${auditResult.summary.completenessScore}%`);
    assert(Array.isArray(auditResult.tableCompletenessBreakdown), 'Table completeness breakdown returned');
    assert(auditResult.tableCompletenessBreakdown.length >= 5, `Evaluated ${auditResult.tableCompletenessBreakdown.length} warehouse tables`);

    for (const tbl of auditResult.tableCompletenessBreakdown) {
      assert(tbl.tableScore >= 0 && tbl.tableScore <= 100, `Table '${tbl.table}' completeness score: ${tbl.tableScore}%`);
      console.log(`    • Table: ${tbl.table.padEnd(24)} | Rows: ${tbl.totalRows.toString().padEnd(6)} | Score: ${tbl.tableScore}%`);
    }

    // 4. Consistency & Referential Integrity Verification
    console.log('\n--- Test 4: Consistency & Referential Integrity Rules ---');
    assert(typeof auditResult.summary.consistencyScore === 'number', `Consistency Score: ${auditResult.summary.consistencyScore}%`);
    assert(Array.isArray(auditResult.consistencyRules), 'Consistency rules array returned');
    assert(auditResult.consistencyRules.length >= 6, `Evaluated ${auditResult.consistencyRules.length} integrity checks`);

    for (const rule of auditResult.consistencyRules) {
      assert(rule.passed === true, `Rule '${rule.ruleId}' (${rule.title}): Violations = ${rule.violations}`);
    }

    // 5. Timeliness & SLA Latency Verification
    console.log('\n--- Test 5: Timeliness & Freshness SLA Evaluation ---');
    assert(typeof auditResult.summary.timelinessScore === 'number', `Timeliness Score: ${auditResult.summary.timelinessScore}%`);
    assert(auditResult.summary.syncAgeMinutes >= 0, `Sync Age: ${auditResult.summary.syncAgeMinutes} minutes`);
    assert(['EXCELLENT', 'GOOD', 'WARNING', 'CRITICAL'].includes(auditResult.summary.status), `Quality Status Grade: ${auditResult.summary.status}`);

    // 6. Data Lineage DAG Graph Verification
    console.log('\n--- Test 6: 4-Tier Architectural Data Lineage DAG ---');
    const lineage = await dataQualityService.getDataLineageGraph();
    assert(Array.isArray(lineage.nodes) && lineage.nodes.length >= 15, `Lineage DAG contains ${lineage.nodes.length} architectural nodes`);
    assert(Array.isArray(lineage.edges) && lineage.edges.length >= 15, `Lineage DAG contains ${lineage.edges.length} data flow edges`);
    assert(Array.isArray(lineage.tiers) && lineage.tiers.length === 4, 'All 4 canonical architectural tiers represented');

    const tier1Nodes = lineage.nodes.filter(n => n.tierIndex === 1);
    const tier2Nodes = lineage.nodes.filter(n => n.tierIndex === 2);
    const tier3Nodes = lineage.nodes.filter(n => n.tierIndex === 3);
    const tier4Nodes = lineage.nodes.filter(n => n.tierIndex === 4);

    assert(tier1Nodes.length >= 5, `Tier 1 (OLTP Sources) has ${tier1Nodes.length} operational tables`);
    assert(tier2Nodes.length >= 5, `Tier 2 (ETL & Transform) has ${tier2Nodes.length} transformation pipelines`);
    assert(tier3Nodes.length >= 5, `Tier 3 (Star Schema DW) has ${tier3Nodes.length} dimensions & facts`);
    assert(tier4Nodes.length >= 5, `Tier 4 (Analytics & Mining) has ${tier4Nodes.length} decision support consumers`);

    // Verify live record counts populated
    const factSalesNode = lineage.nodes.find(n => n.id === 'wh_fact_sales');
    assert(factSalesNode && factSalesNode.recordCount > 0, `fact_sales record count dynamically resolved: ${factSalesNode.recordCount}`);

    // 7. Warehouse Service Section 6 Wrappers
    console.log('\n--- Test 7: Warehouse Service Section 6 Delegation ---');
    const fullReport = await warehouseService.getDataQualityReport();
    assert(fullReport.summary && fullReport.auditHistory && fullReport.recentEtlRuns, 'Full report includes summary, audit history, and recent ETL runs');
    assert(fullReport.auditHistory.length > 0, `Audit history populated with ${fullReport.auditHistory.length} audit checkpoints`);

    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Unexpected test error in Section 6 test suite:', error);
    process.exit(1);
  }
}

runSection6Tests();
