/**
 * Verification Test Suite for Section 1: Data Warehouse Layer & Star Schema (OLAP Foundation)
 * 
 * Verifies:
 * 1. Star Schema table existence and dimensional integrity
 * 2. Fact and Dimension record population
 * 3. Warehouse Model analytical queries
 * 4. Warehouse Service overview, drill-downs, and ETL trigger
 */

import { query } from '../config/db.js';
import { warehouseModel } from '../models/warehouseModel.js';
import { warehouseService } from '../services/warehouseService.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function runWarehouseTests() {
  console.log('================================================================');
  console.log('STARTING SECTION 1: DATA WAREHOUSE & STAR SCHEMA VERIFICATION');
  console.log('================================================================\n');

  try {
    // 1. Table Verification
    console.log('--- 1. Star Schema Physical Tables Verification ---');
    const tables = ['dim_time', 'dim_product', 'dim_customer', 'fact_sales', 'fact_interaction_daily', 'etl_job_runs'];
    for (const t of tables) {
      const res = await query(`SELECT count(*) FROM ${t}`);
      const count = parseInt(res.rows[0].count, 10);
      assert(count > 0, `Table '${t}' exists and has records (count = ${count})`);
    }

    // 2. Dim_Time Verification
    console.log('\n--- 2. Dim_Time Calendar Dimension Tests ---');
    const timeSample = await query('SELECT * FROM dim_time ORDER BY time_id ASC LIMIT 1');
    assert(timeSample.rows.length === 1, 'Sample Dim_Time row retrieved');
    const tRow = timeSample.rows[0];
    assert(tRow.year && tRow.quarter && tRow.month_name && tRow.day_name, 'Dim_Time has rich temporal attributes');

    // 3. Dim_Product Verification
    console.log('\n--- 3. Dim_Product Dimension Hierarchy Tests ---');
    const prodSample = await query(`
      SELECT price_tier, count(*) as cnt 
      FROM dim_product 
      GROUP BY price_tier
    `);
    assert(prodSample.rows.length > 0, 'Dim_Product has price tiers populated');
    for (const p of prodSample.rows) {
      console.log(`    • Price Tier '${p.price_tier}': ${p.cnt} products`);
    }

    // 4. Dim_Customer Verification
    console.log('\n--- 4. Dim_Customer Dimension Tests ---');
    const custSample = await query(`
      SELECT activity_tier, count(*) as cnt 
      FROM dim_customer 
      GROUP BY activity_tier
    `);
    assert(custSample.rows.length > 0, 'Dim_Customer has customer tiers populated');
    for (const c of custSample.rows) {
      console.log(`    • Activity Tier '${c.activity_tier}': ${c.cnt} customers`);
    }

    // 5. Fact_Sales OLAP Verification
    console.log('\n--- 5. Fact_Sales Star Schema Queries ---');
    const summary = await warehouseModel.getWarehouseSummary();
    assert(parseFloat(summary.total_gross_revenue) > 0, `Gross revenue calculated: $${summary.total_gross_revenue}`);
    assert(parseInt(summary.total_orders_count, 10) > 0, `Total orders counted: ${summary.total_orders_count}`);
    assert(parseFloat(summary.average_order_value) > 0, `Average Order Value: $${summary.average_order_value}`);

    // 6. Time Grain OLAP Roll-Up
    console.log('\n--- 6. Time Grain OLAP Roll-Up Tests ---');
    const monthlySales = await warehouseModel.getSalesByTimeGrain({ timeGrain: 'month' });
    assert(monthlySales.length > 0, `Monthly time-grain aggregation returned ${monthlySales.length} periods`);
    
    const weeklySales = await warehouseModel.getSalesByTimeGrain({ timeGrain: 'week' });
    assert(weeklySales.length > 0, `Weekly time-grain aggregation returned ${weeklySales.length} periods`);

    // 7. Category Share Slicing
    console.log('\n--- 7. Category Slicing & Share Tests ---');
    const catSales = await warehouseModel.getSalesByCategory();
    assert(catSales.length > 0, `Category share returned ${catSales.length} categories`);
    console.log(`    • Top Category: ${catSales[0].category_name} ($${catSales[0].net_revenue}, ${catSales[0].revenue_share_pct}%)`);

    // 8. Service Executive Overview
    console.log('\n--- 8. Warehouse Service Executive Overview Aggregation ---');
    const overview = await warehouseService.getExecutiveOverview();
    assert(overview.kpis && overview.kpis.netRevenue > 0, 'Overview KPIs generated');
    assert(overview.monthlyTrend.length > 0, 'Overview monthly trend generated');
    assert(overview.categoryShare.length > 0, 'Overview category share generated');
    assert(overview.priceTiers.length > 0, 'Overview price tiers generated');
    assert(overview.customerTiers.length > 0, 'Overview customer tiers generated');
    assert(overview.etlHealth.status === 'SUCCESS', `Latest ETL status is healthy (${overview.etlHealth.status})`);

    // 9. Lineage & Audit
    console.log('\n--- 9. ETL Lineage & Audit History ---');
    const history = await warehouseModel.getEtlHistory({ limit: 3 });
    assert(history.length > 0, `ETL history records found: ${history.length}`);
    console.log(`    • Latest Job: ${history[0].job_name} | Extracted: ${history[0].records_extracted} | Loaded: ${history[0].records_loaded} | Duration: ${history[0].execution_time_ms}ms`);

  } catch (error) {
    console.error('Unexpected test failure:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runWarehouseTests();
