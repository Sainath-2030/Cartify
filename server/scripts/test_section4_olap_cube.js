/**
 * Section 4: Interactive Multi-Dimensional OLAP Slice & Dice Test Suite
 * 
 * Validates:
 * 1. OLAP Metadata Extraction (Dimensions, Tiers, Calendars)
 * 2. CUBE Aggregation (Product Hierarchy with Subtotals and Grand Total)
 * 3. ROLLUP Aggregation (Temporal Hierarchy: Year -> Quarter -> Month)
 * 4. Slicing Filter (Single Dimension Isolation)
 * 5. Dicing Multi-Filter (Multi-Dimensional Coordinate Sub-Cube)
 * 6. Customer-Product CUBE Matrix
 * 7. HTTP API Endpoint (GET /api/admin/bi/olap-cube)
 */

import jwt from 'jsonwebtoken';
import { warehouseService } from '../services/warehouseService.js';
import { warehouseModel } from '../models/warehouseModel.js';

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

async function runTests() {
  console.log('\n📊 === STARTING SECTION 4 OLAP SLICE & DICE TEST SUITE ===\n');

  try {
    // 1. OLAP Metadata Extraction
    console.log('Test 1: Dimensional Metadata Retrieval');
    const metadata = await warehouseModel.getOlapMetadata();
    assert(Array.isArray(metadata.categories) && metadata.categories.length > 0, `Retrieved ${metadata.categories.length} categories`);
    assert(Array.isArray(metadata.priceTiers) && metadata.priceTiers.length > 0, `Retrieved ${metadata.priceTiers.length} price tiers`);
    assert(Array.isArray(metadata.quarters) && metadata.quarters.length === 4, 'Retrieved all 4 calendar quarters');
    assert(Array.isArray(metadata.months) && metadata.months.length === 12, 'Retrieved all 12 calendar months');
    assert(Array.isArray(metadata.activityTiers) && metadata.activityTiers.length > 0, `Retrieved ${metadata.activityTiers.length} customer activity tiers`);

    // 2. Default Multi-Dimensional CUBE (Category x Price Tier)
    console.log('\nTest 2: CUBE Aggregation (Category x Price Tier)');
    const defaultCube = await warehouseService.getOlapCube({ cubeMode: 'cube', timeGrain: 'month' });
    assert(defaultCube.summary.netRevenue > 0, `Summary net revenue is positive: $${defaultCube.summary.netRevenue.toFixed(2)}`);
    assert(defaultCube.summary.totalOrders > 0, `Summary orders recorded: ${defaultCube.summary.totalOrders}`);
    assert(defaultCube.cubeCells.length > 0, `Retrieved ${defaultCube.cubeCells.length} cube cells`);
    
    const grandTotal = defaultCube.cubeCells.find(c => c.isGrandTotal);
    assert(grandTotal !== undefined, 'Grand Total cell correctly identified with isGrandTotal=true');
    assert(grandTotal && grandTotal.netRevenue === defaultCube.summary.netRevenue, 'Grand Total matches summary net revenue');

    const subtotalCells = defaultCube.cubeCells.filter(c => c.isSubtotal);
    assert(subtotalCells.length > 0, `Identified ${subtotalCells.length} category/tier subtotal cells`);

    // 3. ROLLUP Aggregation (Temporal Hierarchy: Year -> Quarter -> Month)
    console.log('\nTest 3: ROLLUP Aggregation (Year -> Quarter -> Month)');
    const rollupResult = await warehouseService.getOlapCube({ cubeMode: 'rollup' });
    assert(rollupResult.cubeCells.length > 0, `Retrieved ${rollupResult.cubeCells.length} rollup cells`);
    const rollupGrandTotal = rollupResult.cubeCells.find(c => c.isGrandTotal);
    assert(rollupGrandTotal !== undefined, 'Rollup grand total row present');
    const rollupLevels = [...new Set(rollupResult.cubeCells.map(c => c.aggregationLevel))];
    assert(rollupLevels.length >= 2, `Multiple aggregation levels present: [${rollupLevels.join(', ')}]`);

    // 4. Slicing Filter (Single Dimension: Electronics category)
    console.log('\nTest 4: OLAP Slicing (Category = Electronics)');
    const electronicsCat = metadata.categories.find(c => c.categoryName.toLowerCase().includes('electronic'));
    const sliceResult = await warehouseService.getOlapCube({
      categoryId: electronicsCat ? electronicsCat.categoryId : 1,
      cubeMode: 'slice'
    });
    assert(sliceResult.summary.netRevenue > 0, `Sliced net revenue: $${sliceResult.summary.netRevenue.toFixed(2)}`);
    assert(sliceResult.summary.netRevenue <= defaultCube.summary.netRevenue, 'Sliced net revenue is a subset of overall gross fact revenue');
    assert(sliceResult.cubeCells.every(c => c.dim1.toLowerCase().includes('electronic')), 'All returned cells belong strictly to the sliced category');

    // 5. Dicing Multi-Filter (Category = Electronics AND Quarter = Q3 AND PriceTier = LUXURY)
    console.log('\nTest 5: OLAP Dicing (Category = Electronics AND Quarter = 3 AND PriceTier = LUXURY)');
    const diceResult = await warehouseService.getOlapCube({
      categoryId: electronicsCat ? electronicsCat.categoryId : 1,
      quarter: 3,
      priceTier: 'LUXURY',
      cubeMode: 'cube'
    });
    assert(diceResult.summary.netRevenue > 0, `Diced net revenue: $${diceResult.summary.netRevenue.toFixed(2)}`);
    assert(diceResult.summary.netRevenue <= sliceResult.summary.netRevenue, 'Diced sub-cube is narrower than single-dimension slice');
    assert(diceResult.activeFilters.quarter === 3, 'Active filter quarter preserved as 3');
    assert(diceResult.activeFilters.priceTier === 'LUXURY', 'Active filter priceTier preserved as LUXURY');

    // 6. Customer-Product CUBE Matrix
    console.log('\nTest 6: Customer-Product CUBE (ActivityTier x Category)');
    const customerCube = await warehouseService.getOlapCube({ cubeMode: 'customer_cube' });
    assert(customerCube.cubeCells.length > 0, `Retrieved ${customerCube.cubeCells.length} customer-product cells`);
    const custGrandTotal = customerCube.cubeCells.find(c => c.isGrandTotal);
    assert(custGrandTotal !== undefined, 'Customer cube grand total row present');

    // 7. TimeGrain Drill-Down (Daily vs Weekly vs Monthly)
    console.log('\nTest 7: Temporal Drill-Down (Day, Week, Month)');
    const [dayCube, weekCube, monthCube] = await Promise.all([
      warehouseService.getOlapCube({ timeGrain: 'day' }),
      warehouseService.getOlapCube({ timeGrain: 'week' }),
      warehouseService.getOlapCube({ timeGrain: 'month' })
    ]);
    assert(dayCube.timeSeries.length >= weekCube.timeSeries.length, `Day grain periods (${dayCube.timeSeries.length}) >= Week grain periods (${weekCube.timeSeries.length})`);
    assert(weekCube.timeSeries.length >= monthCube.timeSeries.length, `Week grain periods (${weekCube.timeSeries.length}) >= Month grain periods (${monthCube.timeSeries.length})`);

    // 8. HTTP API Verification
    console.log('\nTest 8: HTTP API Endpoint (GET /api/admin/bi/olap-cube)');
    const token = jwt.sign(
      { id: 1, role: 'ADMIN', email: 'admin@cartify.com' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    const port = process.env.PORT || 5000;
    const response = await fetch(`http://localhost:${port}/api/admin/bi/olap-cube?timeGrain=month&cubeMode=cube&quarter=3`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    assert(response.status === 200, `API returned HTTP 200 (Got ${response.status})`);
    const json = await response.json();
    assert(json.success === true, 'API response has success: true');
    assert(json.data.summary && json.data.summary.netRevenue > 0, 'API response contains valid summary netRevenue');
    assert(Array.isArray(json.data.cubeCells) && json.data.cubeCells.length > 0, 'API response contains cubeCells array');
    assert(Array.isArray(json.data.timeSeries), 'API response contains timeSeries array');

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('\n=========================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('=========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
