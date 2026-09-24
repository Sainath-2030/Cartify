/**
 * ETL Batch Loading Script for Cartify Data Warehouse (Star Schema)
 * 
 * Pipeline Phases:
 * 1. EXTRACT: Query operational tables (users, categories, products, orders, order_items, interactions)
 * 2. TRANSFORM:
 *    - Generate Dim_Time dimensional records covering the required temporal horizon
 *    - Normalize & categorize Dim_Product with price/rating hierarchies
 *    - Compute customer RFM metrics and activity tiers for Dim_Customer
 *    - Pre-aggregate interaction event telemetry into Fact_Interaction_Daily
 *    - Denormalize order line items with surrogate keys into Fact_Sales
 * 3. LOAD: Bulk upsert / insert into star schema dimension and fact tables
 * 4. AUDIT: Record lineage and execution telemetry in etl_job_runs
 */

import { pool, query } from '../config/db.js';

// Helper: Format Date to Integer Time Key YYYYMMDD
export function toTimeId(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`, 10);
}

// Helper: Get ISO Week number
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// Helper: Derive Price Tier
function getPriceTier(price) {
  const p = parseFloat(price) || 0;
  if (p < 25) return 'BUDGET';
  if (p < 100) return 'MID_RANGE';
  if (p < 300) return 'PREMIUM';
  return 'LUXURY';
}

// Helper: Derive Rating Tier
function getRatingTier(rating) {
  if (rating === null || rating === undefined) return 'UNRATED';
  const r = parseFloat(rating);
  if (r >= 4.5) return 'EXCELLENT';
  if (r >= 4.0) return 'GOOD';
  if (r >= 3.0) return 'AVERAGE';
  if (r > 0) return 'LOW';
  return 'UNRATED';
}

// Helper: Generate Dim_Time range
export async function populateDimTime(startDate = '2025-01-01', endDate = '2027-12-31') {
  console.log(`[ETL] Generating Dim_Time records from ${startDate} to ${endDate}...`);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const records = [];

  let current = new Date(start);
  while (current <= end) {
    const timeId = toTimeId(current);
    const fullDate = current.toISOString().split('T')[0];
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth() + 1;
    const monthName = months[current.getUTCMonth()];
    const monthShortName = shortMonths[current.getUTCMonth()];
    const quarter = Math.ceil(month / 3);
    const quarterName = `Q${quarter}`;
    const day = current.getUTCDate();
    const dayOfWeek = current.getUTCDay() + 1; // 1 = Sun, 7 = Sat
    const dayName = days[current.getUTCDay()];
    const dayShortName = shortDays[current.getUTCDay()];
    const weekOfYear = Math.min(53, Math.max(1, getWeekNumber(current)));
    const isWeekend = current.getUTCDay() === 0 || current.getUTCDay() === 6;

    records.push({
      timeId,
      fullDate,
      year,
      quarter,
      quarterName,
      month,
      monthName,
      monthShortName,
      weekOfYear,
      day,
      dayOfWeek,
      dayName,
      dayShortName,
      isWeekend,
      isHoliday: false
    });

    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Bulk Insert into dim_time
  const batchSize = 200;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let pIdx = 1;

    for (const r of batch) {
      values.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
      params.push(
        r.timeId, r.fullDate, r.year, r.quarter, r.quarterName,
        r.month, r.monthName, r.monthShortName, r.weekOfYear,
        r.day, r.dayOfWeek, r.dayName, r.dayShortName,
        r.isWeekend, r.isHoliday
      );
    }

    const queryText = `
      INSERT INTO dim_time (
        time_id, full_date, year, quarter, quarter_name,
        month, month_name, month_short_name, week_of_year,
        day, day_of_week, day_name, day_short_name,
        is_weekend, is_holiday
      )
      VALUES ${values.join(', ')}
      ON CONFLICT (time_id) DO UPDATE SET
        year = EXCLUDED.year,
        quarter = EXCLUDED.quarter,
        month = EXCLUDED.month,
        is_weekend = EXCLUDED.is_weekend;
    `;
    await query(queryText, params);
  }

  console.log(`[ETL] Dim_Time loaded with ${records.length} date dimension records.`);
  return records.length;
}

// Seed realistic synthetic orders if operational order count is low (< 50)
export async function seedRealisticTransactionsIfLow() {
  const orderCountRes = await query('SELECT count(*) FROM orders');
  const currentCount = parseInt(orderCountRes.rows[0].count, 10);

  if (currentCount >= 50) {
    console.log(`[ETL] Existing orders count (${currentCount}) is sufficient. Skipping synthetic seed.`);
    return;
  }

  console.log(`[ETL] Order count is low (${currentCount}). Seeding realistic multi-item transactions...`);

  // Fetch users and sample products
  const usersRes = await query('SELECT id FROM users LIMIT 50');
  const productsRes = await query(`
    SELECT p.id, p.name, p.final_price, p.category_id, c.name as category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = TRUE
    ORDER BY p.rating DESC NULLS LAST, p.review_count DESC
    LIMIT 200
  `);

  if (usersRes.rows.length === 0 || productsRes.rows.length === 0) {
    console.warn('[ETL] Insufficient users or products to seed transactions.');
    return;
  }

  const users = usersRes.rows;
  const products = productsRes.rows;
  const targetOrders = 120;
  const now = new Date();

  // Create transactions distributed across the last 90 days
  for (let i = 0; i < targetOrders; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const daysAgo = Math.floor(Math.random() * 85);
    const orderDate = new Date(now.getTime() - (daysAgo * 86400000) - (Math.floor(Math.random() * 86400) * 1000));
    
    // Choose 1 to 4 distinct products for this basket
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const selectedProducts = [];
    const usedProductIds = new Set();

    for (let k = 0; k < itemCount; k++) {
      const p = products[Math.floor(Math.random() * products.length)];
      if (!usedProductIds.has(p.id)) {
        usedProductIds.add(p.id);
        const qty = 1 + (Math.random() < 0.25 ? 1 : 0);
        selectedProducts.push({
          productId: p.id,
          unitPrice: parseFloat(p.final_price),
          quantity: qty,
          totalPrice: parseFloat(p.final_price) * qty
        });
      }
    }

    if (selectedProducts.length === 0) continue;

    const totalAmount = selectedProducts.reduce((sum, item) => sum + item.totalPrice, 0);

    const shippingAddress = {
      fullName: 'Customer ' + user.id,
      street: '123 Market Way',
      city: ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'][i % 6],
      state: ['Maharashtra', 'Karnataka', 'Delhi', 'Telangana', 'Maharashtra', 'Tamil Nadu'][i % 6],
      postalCode: '40000' + (i % 9),
      country: 'India'
    };

    const orderRes = await query(`
      INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method, payment_status, created_at, updated_at)
      VALUES ($1, $2, 'DELIVERED', $3, 'SIMULATED_GATEWAY', 'PAID', $4, $4)
      RETURNING id
    `, [user.id, totalAmount.toFixed(2), JSON.stringify(shippingAddress), orderDate]);

    const orderId = orderRes.rows[0].id;

    for (const item of selectedProducts) {
      await query(`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5)
      `, [orderId, item.productId, item.quantity, item.unitPrice, item.totalPrice.toFixed(2)]);

      // Also ensure interaction telemetry exists for this purchase
      await query(`
        INSERT INTO interactions (user_id, session_id, product_id, interaction_type, metadata, created_at)
        VALUES ($1, $2, $3, 'PURCHASE', $4, $5)
      `, [
        user.id,
        `sess_seed_${user.id}_${i}`,
        item.productId,
        JSON.stringify({ order_id: orderId, source: 'etl_seed' }),
        orderDate
      ]);
    }
  }

  console.log(`[ETL] Seeded ${targetOrders} realistic historical transactions.`);
}

/**
 * Main ETL Execution Function
 */
export async function runETLPipeline() {
  const startTime = Date.now();
  console.log('================================================================');
  console.log('[ETL] Starting Cartify Data Warehouse Refresh (Star Schema)...');
  console.log('================================================================');

  let extractedCount = 0;
  let transformedCount = 0;
  let loadedCount = 0;

  try {
    // 1. DIM_TIME
    const timeCount = await populateDimTime('2025-01-01', '2027-12-31');
    loadedCount += timeCount;

    // 2. OPTIONAL TRANSACTION SEEDING
    await seedRealisticTransactionsIfLow();

    // 3. TRANSFORM & LOAD DIM_PRODUCT
    console.log('[ETL] Populating Dim_Product dimension...');
    const productExtractRes = await query(`
      SELECT 
        p.id, p.name, p.brand, p.category_id, c.name AS category_name,
        p.subcategory, p.final_price, p.rating, p.review_count,
        p.stock_quantity, p.verification_status, p.source, p.is_active
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `);

    extractedCount += productExtractRes.rows.length;

    const productValues = [];
    const productParams = [];
    let pIdx = 1;

    for (const p of productExtractRes.rows) {
      const priceTier = getPriceTier(p.final_price);
      const ratingTier = getRatingTier(p.rating);

      productValues.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, NOW())`);
      productParams.push(
        p.id,
        p.name || 'Unnamed Product',
        p.brand || 'Generic',
        p.category_id || 1,
        p.category_name || 'Uncategorized',
        p.subcategory || null,
        p.final_price || 0,
        priceTier,
        p.rating,
        ratingTier,
        p.review_count || 0,
        p.stock_quantity || 0,
        p.verification_status || 'VERIFIED',
        p.source || 'cartify',
        p.is_active ?? true
      );
    }

    if (productValues.length > 0) {
      // Chunk bulk inserts of dim_product
      const chunkSize = 150;
      for (let i = 0; i < productExtractRes.rows.length; i += chunkSize) {
        const slice = productExtractRes.rows.slice(i, i + chunkSize);
        const subVals = [];
        const subParams = [];
        let subIdx = 1;
        for (const p of slice) {
          subVals.push(`($${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, $${subIdx++}, NOW())`);
          subParams.push(
            p.id,
            p.name || 'Unnamed Product',
            p.brand || 'Generic',
            p.category_id || 1,
            p.category_name || 'Uncategorized',
            p.subcategory || null,
            p.final_price || 0,
            getPriceTier(p.final_price),
            p.rating,
            getRatingTier(p.rating),
            p.review_count || 0,
            p.stock_quantity || 0,
            p.verification_status || 'VERIFIED',
            p.source || 'cartify',
            p.is_active ?? true
          );
        }

        const queryText = `
          INSERT INTO dim_product (
            product_id, title, brand, category_id, category_name,
            subcategory, price, price_tier, rating, rating_tier,
            review_count, stock_quantity, verification_status, source, is_active, last_updated
          )
          VALUES ${subVals.join(', ')}
          ON CONFLICT (product_id) DO UPDATE SET
            title = EXCLUDED.title,
            brand = EXCLUDED.brand,
            category_id = EXCLUDED.category_id,
            category_name = EXCLUDED.category_name,
            subcategory = EXCLUDED.subcategory,
            price = EXCLUDED.price,
            price_tier = EXCLUDED.price_tier,
            rating = EXCLUDED.rating,
            rating_tier = EXCLUDED.rating_tier,
            review_count = EXCLUDED.review_count,
            stock_quantity = EXCLUDED.stock_quantity,
            verification_status = EXCLUDED.verification_status,
            is_active = EXCLUDED.is_active,
            last_updated = NOW();
        `;
        await query(queryText, subParams);
      }
      transformedCount += productExtractRes.rows.length;
      loadedCount += productExtractRes.rows.length;
      console.log(`[ETL] Dim_Product loaded with ${productExtractRes.rows.length} products.`);
    }

    // 4. TRANSFORM & LOAD DIM_CUSTOMER
    console.log('[ETL] Populating Dim_Customer dimension...');
    const customerExtractRes = await query(`
      SELECT 
        u.id, u.email, u.full_name, u.city, u.state, u.postal_code, u.created_at,
        COUNT(o.id) as order_count,
        COALESCE(SUM(o.total_amount), 0) as total_spend,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
    `);

    extractedCount += customerExtractRes.rows.length;

    for (const c of customerExtractRes.rows) {
      const orderCount = parseInt(c.order_count, 10) || 0;
      const totalSpend = parseFloat(c.total_spend) || 0;
      const createdDate = new Date(c.created_at);
      const ageDays = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / 86400000));

      let activityTier = 'INACTIVE';
      if (orderCount >= 5 || totalSpend >= 500) {
        activityTier = 'POWER_BUYER';
      } else if (orderCount >= 2 || totalSpend >= 150) {
        activityTier = 'REGULAR';
      } else if (orderCount >= 1) {
        activityTier = 'OCCASIONAL';
      }

      await query(`
        INSERT INTO dim_customer (
          customer_id, email, full_name, city, state, postal_code,
          created_at, account_age_days, activity_tier, total_orders_count, total_spend,
          last_order_date, last_updated
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        ON CONFLICT (customer_id) DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          postal_code = EXCLUDED.postal_code,
          account_age_days = EXCLUDED.account_age_days,
          activity_tier = EXCLUDED.activity_tier,
          total_orders_count = EXCLUDED.total_orders_count,
          total_spend = EXCLUDED.total_spend,
          last_order_date = EXCLUDED.last_order_date,
          last_updated = NOW();
      `, [
        c.id, c.email, c.full_name, c.city || 'Unknown', c.state || 'Unknown', c.postal_code || null,
        c.created_at, ageDays, activityTier, orderCount, totalSpend.toFixed(2), c.last_order_date
      ]);
    }
    transformedCount += customerExtractRes.rows.length;
    loadedCount += customerExtractRes.rows.length;
    console.log(`[ETL] Dim_Customer loaded with ${customerExtractRes.rows.length} customers.`);

    // 5. TRANSFORM & LOAD FACT_SALES
    console.log('[ETL] Denormalizing and loading Fact_Sales...');
    const salesExtractRes = await query(`
      SELECT 
        oi.id as order_item_id,
        o.id as order_id,
        o.user_id as customer_id,
        oi.product_id,
        oi.quantity as quantity_sold,
        oi.unit_price,
        oi.total_price as total_revenue,
        COALESCE(p.discount_percentage, 0) as discount_percentage,
        o.status as order_status,
        o.payment_method,
        o.created_at
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
    `);

    extractedCount += salesExtractRes.rows.length;

    for (const item of salesExtractRes.rows) {
      const timeId = toTimeId(item.created_at);
      const unitPrice = parseFloat(item.unit_price) || 0;
      const quantity = parseInt(item.quantity_sold, 10) || 1;
      const totalRevenue = parseFloat(item.total_revenue) || (unitPrice * quantity);
      const discountPct = parseFloat(item.discount_percentage) || 0;
      const discountAmount = parseFloat(((totalRevenue * discountPct) / 100).toFixed(2));
      const netRevenue = parseFloat((totalRevenue - discountAmount).toFixed(2));

      await query(`
        INSERT INTO fact_sales (
          time_id, product_id, customer_id, order_id, order_item_id,
          quantity_sold, unit_price, total_revenue, discount_amount, net_revenue,
          order_status, payment_method, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (order_id, product_id, order_item_id) DO UPDATE SET
          time_id = EXCLUDED.time_id,
          quantity_sold = EXCLUDED.quantity_sold,
          unit_price = EXCLUDED.unit_price,
          total_revenue = EXCLUDED.total_revenue,
          discount_amount = EXCLUDED.discount_amount,
          net_revenue = EXCLUDED.net_revenue,
          order_status = EXCLUDED.order_status;
      `, [
        timeId, item.product_id, item.customer_id, item.order_id, item.order_item_id,
        quantity, unitPrice.toFixed(2), totalRevenue.toFixed(2), discountAmount.toFixed(2), netRevenue.toFixed(2),
        item.order_status || 'DELIVERED', item.payment_method || 'SIMULATED_GATEWAY', item.created_at
      ]);
    }
    transformedCount += salesExtractRes.rows.length;
    loadedCount += salesExtractRes.rows.length;
    console.log(`[ETL] Fact_Sales loaded with ${salesExtractRes.rows.length} line item facts.`);

    // 6. TRANSFORM & LOAD FACT_INTERACTION_DAILY
    console.log('[ETL] Aggregating telemetry into Fact_Interaction_Daily...');
    const telemetryAggRes = await query(`
      SELECT 
        DATE(i.created_at) as event_date,
        i.product_id,
        p.category_id,
        COUNT(CASE WHEN i.interaction_type = 'VIEW' THEN 1 END) as view_count,
        COUNT(CASE WHEN i.interaction_type = 'SEARCH' THEN 1 END) as search_count,
        COUNT(CASE WHEN i.interaction_type = 'CART_ADD' THEN 1 END) as cart_count,
        COUNT(CASE WHEN i.interaction_type = 'WISHLIST_ADD' THEN 1 END) as wishlist_count,
        COUNT(CASE WHEN i.interaction_type = 'PURCHASE' THEN 1 END) as purchase_count,
        COUNT(*) as total_interactions,
        COUNT(DISTINCT i.user_id) as unique_users_count,
        COUNT(DISTINCT i.session_id) as unique_sessions_count
      FROM interactions i
      JOIN products p ON i.product_id = p.id
      GROUP BY DATE(i.created_at), i.product_id, p.category_id
    `);

    extractedCount += telemetryAggRes.rows.length;

    for (const agg of telemetryAggRes.rows) {
      const timeId = toTimeId(agg.event_date);
      await query(`
        INSERT INTO fact_interaction_daily (
          time_id, product_id, category_id,
          view_count, search_count, cart_count, wishlist_count, purchase_count,
          total_interactions, unique_users_count, unique_sessions_count, aggregated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (time_id, product_id) DO UPDATE SET
          view_count = EXCLUDED.view_count,
          search_count = EXCLUDED.search_count,
          cart_count = EXCLUDED.cart_count,
          wishlist_count = EXCLUDED.wishlist_count,
          purchase_count = EXCLUDED.purchase_count,
          total_interactions = EXCLUDED.total_interactions,
          unique_users_count = EXCLUDED.unique_users_count,
          unique_sessions_count = EXCLUDED.unique_sessions_count,
          aggregated_at = NOW();
      `, [
        timeId, agg.product_id, agg.category_id,
        parseInt(agg.view_count, 10), parseInt(agg.search_count, 10),
        parseInt(agg.cart_count, 10), parseInt(agg.wishlist_count, 10),
        parseInt(agg.purchase_count, 10), parseInt(agg.total_interactions, 10),
        parseInt(agg.unique_users_count, 10), parseInt(agg.unique_sessions_count, 10)
      ]);
    }
    transformedCount += telemetryAggRes.rows.length;
    loadedCount += telemetryAggRes.rows.length;
    console.log(`[ETL] Fact_Interaction_Daily loaded with ${telemetryAggRes.rows.length} product-day aggregates.`);

    // 7. RECORD ETL AUDIT LOG
    const executionTimeMs = Date.now() - startTime;
    await query(`
      INSERT INTO etl_job_runs (
        job_name, records_extracted, records_transformed, records_loaded,
        execution_time_ms, status, details, started_at, completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${Math.ceil(executionTimeMs / 1000)} seconds', NOW())
    `, [
      'ETL_STAR_SCHEMA_REFRESH',
      extractedCount,
      transformedCount,
      loadedCount,
      executionTimeMs,
      'SUCCESS',
      JSON.stringify({
        dim_time_count: timeCount,
        dim_product_count: productExtractRes.rows.length,
        dim_customer_count: customerExtractRes.rows.length,
        fact_sales_count: salesExtractRes.rows.length,
        fact_interaction_count: telemetryAggRes.rows.length
      })
    ]);

    console.log('================================================================');
    console.log(`[ETL] Pipeline completed successfully in ${executionTimeMs} ms.`);
    console.log(`[ETL] Summary: Extracted ${extractedCount} | Transformed ${transformedCount} | Loaded ${loadedCount}`);
    console.log('================================================================');

    return {
      success: true,
      executionTimeMs,
      extractedCount,
      transformedCount,
      loadedCount
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    console.error('[ETL] Error during ETL execution:', error);

    try {
      await query(`
        INSERT INTO etl_job_runs (
          job_name, records_extracted, records_transformed, records_loaded,
          execution_time_ms, status, error_message, started_at, completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${Math.ceil(executionTimeMs / 1000)} seconds', NOW())
      `, [
        'ETL_STAR_SCHEMA_REFRESH',
        extractedCount,
        transformedCount,
        loadedCount,
        executionTimeMs,
        'FAILED',
        error.message
      ]);
    } catch (auditErr) {
      console.error('[ETL] Failed to record error audit log:', auditErr);
    }

    throw error;
  }
}

// Standalone script execution support
if (process.argv[1]?.endsWith('etl_populate_warehouse.js')) {
  runETLPipeline()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('ETL Pipeline failed:', err);
      process.exit(1);
    });
}
