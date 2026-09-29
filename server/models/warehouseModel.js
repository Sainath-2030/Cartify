/**
 * Cartify Data Warehouse Model (OLAP Star Schema Query Engine)
 * 
 * Provides high-performance multi-dimensional queries across Star Schema:
 * Fact: fact_sales, fact_interaction_daily
 * Dimensions: dim_time, dim_product, dim_customer
 */

import { query } from '../config/db.js';

export const warehouseModel = {
  /**
   * Executive Top-Level KPI Summary (Aggregated from Fact_Sales and Dimensions)
   */
  async getWarehouseSummary() {
    const text = `
      SELECT 
        COALESCE(SUM(fs.total_revenue), 0) AS total_gross_revenue,
        COALESCE(SUM(fs.discount_amount), 0) AS total_discounts,
        COALESCE(SUM(fs.net_revenue), 0) AS total_net_revenue,
        COALESCE(SUM(fs.quantity_sold), 0) AS total_units_sold,
        COUNT(DISTINCT fs.order_id) AS total_orders_count,
        COUNT(DISTINCT fs.customer_id) AS active_customers_count,
        COUNT(DISTINCT fs.product_id) AS products_transacted_count,
        ROUND(COALESCE(AVG(fs.net_revenue), 0), 2) AS avg_item_revenue,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT fs.order_id) > 0 THEN COALESCE(SUM(fs.net_revenue), 0) / COUNT(DISTINCT fs.order_id)
            ELSE 0 
          END, 2
        ) AS average_order_value
      FROM fact_sales fs;
    `;
    const res = await query(text);
    return res.rows[0];
  },

  /**
   * Time-Series OLAP Aggregation (Roll-Up / Drill-Down by Day, Week, Month, Quarter, Year)
   */
  async getSalesByTimeGrain({ timeGrain = 'month', year, quarter, categoryId } = {}) {
    let selectClause = '';
    let groupByClause = '';
    let orderByClause = '';
    const params = [];
    let pIdx = 1;
    const whereConditions = [];

    if (year) {
      whereConditions.push(`dt.year = $${pIdx++}`);
      params.push(parseInt(year, 10));
    }
    if (quarter) {
      whereConditions.push(`dt.quarter = $${pIdx++}`);
      params.push(parseInt(quarter, 10));
    }
    if (categoryId) {
      whereConditions.push(`dp.category_id = $${pIdx++}`);
      params.push(parseInt(categoryId, 10));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    switch (timeGrain.toLowerCase()) {
      case 'day':
        selectClause = `
          dt.full_date AS period_key,
          TO_CHAR(dt.full_date, 'YYYY-MM-DD') AS period_label,
          dt.day_short_name AS day_name,
          dt.is_weekend
        `;
        groupByClause = `dt.full_date, dt.day_short_name, dt.is_weekend`;
        orderByClause = `dt.full_date ASC`;
        break;

      case 'week':
        selectClause = `
          TO_CHAR(DATE_TRUNC('week', dt.full_date)::date, 'IYYY-"W"IW') AS period_key,
          TO_CHAR(DATE_TRUNC('week', dt.full_date)::date, '"Wk "IW (IYYY)') AS period_label,
          DATE_TRUNC('week', dt.full_date)::date AS week_start
        `;
        groupByClause = `DATE_TRUNC('week', dt.full_date)::date`;
        orderByClause = `DATE_TRUNC('week', dt.full_date)::date ASC`;
        break;

      case 'quarter':
        selectClause = `
          CONCAT(dt.year, '-Q', dt.quarter) AS period_key,
          CONCAT(dt.quarter_name, ' ', dt.year) AS period_label,
          dt.year,
          dt.quarter
        `;
        groupByClause = `dt.year, dt.quarter, dt.quarter_name`;
        orderByClause = `dt.year ASC, dt.quarter ASC`;
        break;

      case 'year':
        selectClause = `
          dt.year::text AS period_key,
          dt.year::text AS period_label,
          dt.year
        `;
        groupByClause = `dt.year`;
        orderByClause = `dt.year ASC`;
        break;

      case 'month':
      default:
        selectClause = `
          CONCAT(dt.year, '-', LPAD(dt.month::text, 2, '0')) AS period_key,
          CONCAT(dt.month_short_name, ' ', dt.year) AS period_label,
          dt.year,
          dt.month
        `;
        groupByClause = `dt.year, dt.month, dt.month_short_name`;
        orderByClause = `dt.year ASC, dt.month ASC`;
        break;
    }

    const text = `
      SELECT 
        ${selectClause},
        COALESCE(SUM(fs.total_revenue), 0) AS gross_revenue,
        COALESCE(SUM(fs.discount_amount), 0) AS total_discounts,
        COALESCE(SUM(fs.net_revenue), 0) AS net_revenue,
        COALESCE(SUM(fs.quantity_sold), 0) AS units_sold,
        COUNT(DISTINCT fs.order_id) AS order_count,
        COUNT(DISTINCT fs.customer_id) AS unique_buyers
      FROM fact_sales fs
      JOIN dim_time dt ON fs.time_id = dt.time_id
      JOIN dim_product dp ON fs.product_id = dp.product_id
      ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY ${orderByClause};
    `;

    const res = await query(text, params);
    return res.rows;
  },

  /**
   * Category Slice & Dice Performance
   */
  async getSalesByCategory({ year, quarter, month } = {}) {
    const params = [];
    let pIdx = 1;
    const whereConditions = [];

    if (year) {
      whereConditions.push(`dt.year = $${pIdx++}`);
      params.push(parseInt(year, 10));
    }
    if (quarter) {
      whereConditions.push(`dt.quarter = $${pIdx++}`);
      params.push(parseInt(quarter, 10));
    }
    if (month) {
      whereConditions.push(`dt.month = $${pIdx++}`);
      params.push(parseInt(month, 10));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const text = `
      WITH category_totals AS (
        SELECT 
          dp.category_id,
          dp.category_name,
          COALESCE(SUM(fs.net_revenue), 0) AS net_revenue,
          COALESCE(SUM(fs.quantity_sold), 0) AS units_sold,
          COUNT(DISTINCT fs.order_id) AS order_count,
          COUNT(DISTINCT fs.product_id) AS distinct_products_sold,
          ROUND(COALESCE(AVG(fs.unit_price), 0), 2) AS avg_unit_price
        FROM fact_sales fs
        JOIN dim_time dt ON fs.time_id = dt.time_id
        JOIN dim_product dp ON fs.product_id = dp.product_id
        ${whereClause}
        GROUP BY dp.category_id, dp.category_name
      ),
      grand_total AS (
        SELECT NULLIF(SUM(net_revenue), 0) AS overall_revenue FROM category_totals
      )
      SELECT 
        ct.*,
        COALESCE(ROUND((ct.net_revenue / gt.overall_revenue) * 100, 2), 0) AS revenue_share_pct
      FROM category_totals ct
      CROSS JOIN grand_total gt
      ORDER BY ct.net_revenue DESC;
    `;

    const res = await query(text, params);
    return res.rows;
  },

  /**
   * Multi-Dimensional Price Tier Breakdown
   */
  async getSalesByPriceTier() {
    const text = `
      SELECT 
        dp.price_tier,
        COUNT(DISTINCT dp.product_id) AS product_count,
        COALESCE(SUM(fs.quantity_sold), 0) AS units_sold,
        COALESCE(SUM(fs.net_revenue), 0) AS total_revenue,
        ROUND(COALESCE(AVG(fs.unit_price), 0), 2) AS avg_unit_price
      FROM dim_product dp
      LEFT JOIN fact_sales fs ON dp.product_id = fs.product_id
      GROUP BY dp.price_tier
      ORDER BY total_revenue DESC;
    `;
    const res = await query(text);
    return res.rows;
  },

  /**
   * Customer Activity Tier Distribution (OLAP Customer Cube)
   */
  async getSalesByCustomerActivityTier() {
    const text = `
      SELECT 
        dc.activity_tier,
        COUNT(DISTINCT dc.customer_id) AS customer_count,
        COALESCE(SUM(fs.net_revenue), 0) AS total_revenue,
        COALESCE(SUM(fs.quantity_sold), 0) AS units_purchased,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT dc.customer_id) > 0 THEN COALESCE(SUM(fs.net_revenue), 0) / COUNT(DISTINCT dc.customer_id)
            ELSE 0 
          END, 2
        ) AS revenue_per_customer
      FROM dim_customer dc
      LEFT JOIN fact_sales fs ON dc.customer_id = fs.customer_id
      GROUP BY dc.activity_tier
      ORDER BY total_revenue DESC;
    `;
    const res = await query(text);
    return res.rows;
  },

  /**
   * Daily Telemetry Trend from Fact_Interaction_Daily
   */
  async getTelemetryDailyTrend({ limit = 30 } = {}) {
    const text = `
      SELECT 
        dt.full_date,
        TO_CHAR(dt.full_date, 'YYYY-MM-DD') AS date_label,
        COALESCE(SUM(fid.view_count), 0) AS views,
        COALESCE(SUM(fid.search_count), 0) AS searches,
        COALESCE(SUM(fid.cart_count), 0) AS carts,
        COALESCE(SUM(fid.wishlist_count), 0) AS wishlists,
        COALESCE(SUM(fid.purchase_count), 0) AS purchases,
        COALESCE(SUM(fid.total_interactions), 0) AS total_interactions,
        COALESCE(SUM(fid.unique_users_count), 0) AS unique_users
      FROM fact_interaction_daily fid
      JOIN dim_time dt ON fid.time_id = dt.time_id
      GROUP BY dt.full_date
      ORDER BY dt.full_date DESC
      LIMIT $1;
    `;
    const res = await query(text, [limit]);
    return res.rows.reverse(); // Return chronological
  },

  /**
   * Top Selling Products Fact Join
   */
  async getTopSellingProducts({ limit = 10, categoryId } = {}) {
    const params = [limit];
    let whereClause = '';

    if (categoryId) {
      whereClause = 'WHERE dp.category_id = $2';
      params.push(parseInt(categoryId, 10));
    }

    const text = `
      SELECT 
        dp.product_id,
        dp.title,
        dp.brand,
        dp.category_name,
        dp.price_tier,
        COALESCE(SUM(fs.quantity_sold), 0) AS units_sold,
        COALESCE(SUM(fs.net_revenue), 0) AS total_revenue,
        COUNT(DISTINCT fs.order_id) AS orders_count
      FROM fact_sales fs
      JOIN dim_product dp ON fs.product_id = dp.product_id
      ${whereClause}
      GROUP BY dp.product_id, dp.title, dp.brand, dp.category_name, dp.price_tier
      ORDER BY total_revenue DESC
      LIMIT $1;
    `;
    const res = await query(text, params);
    return res.rows;
  },

  /**
   * ETL Job Runs Audit History
   */
  async getEtlHistory({ limit = 10 } = {}) {
    const text = `
      SELECT 
        job_id,
        job_name,
        records_extracted,
        records_transformed,
        records_loaded,
        execution_time_ms,
        status,
        details,
        error_message,
        started_at,
        completed_at
      FROM etl_job_runs
      ORDER BY started_at DESC
      LIMIT $1;
    `;
    const res = await query(text, [limit]);
    return res.rows;
  },

  /**
   * SECTION 4: Multi-Dimensional OLAP Metadata
   * Returns available dimensions and discrete domain members for interactive Slice & Dice
   */
  async getOlapMetadata() {
    const [yearsRes, quartersRes, monthsRes, categoriesRes, priceTiersRes, custTiersRes] = await Promise.all([
      query(`SELECT DISTINCT year FROM dim_time ORDER BY year`),
      query(`SELECT DISTINCT quarter, quarter_name FROM dim_time ORDER BY quarter`),
      query(`SELECT DISTINCT month, month_short_name FROM dim_time ORDER BY month`),
      query(`SELECT category_id, category_name, COUNT(*) AS product_count FROM dim_product GROUP BY category_id, category_name ORDER BY category_name`),
      query(`SELECT DISTINCT price_tier FROM dim_product WHERE price_tier IS NOT NULL ORDER BY price_tier`),
      query(`SELECT DISTINCT activity_tier FROM dim_customer WHERE activity_tier IS NOT NULL ORDER BY activity_tier`)
    ]);

    return {
      years: yearsRes.rows.map(r => r.year),
      quarters: quartersRes.rows.map(r => ({ quarter: r.quarter, quarterName: r.quarter_name })),
      months: monthsRes.rows.map(r => ({ month: r.month, monthShortName: r.month_short_name })),
      categories: categoriesRes.rows.map(r => ({
        categoryId: parseInt(r.category_id, 10),
        categoryName: r.category_name,
        productCount: parseInt(r.product_count, 10)
      })),
      priceTiers: priceTiersRes.rows.map(r => r.price_tier),
      activityTiers: custTiersRes.rows.map(r => r.activity_tier)
    };
  },

  /**
   * SECTION 4: Multi-Dimensional OLAP Cube Aggregations (CUBE, ROLLUP, Slicing & Dicing)
   */
  async getOlapCubeData({
    timeGrain = 'month',
    categoryId,
    priceTier,
    activityTier,
    year,
    quarter,
    month,
    cubeMode = 'cube',
    metric = 'net_revenue'
  } = {}) {
    // 1. Build dynamic parameterized WHERE conditions for Slicing and Dicing
    const whereConditions = [];
    const params = [];
    let pIdx = 1;

    if (categoryId) {
      whereConditions.push(`dp.category_id = $${pIdx++}`);
      params.push(parseInt(categoryId, 10));
    }
    if (priceTier) {
      whereConditions.push(`dp.price_tier = $${pIdx++}`);
      params.push(priceTier);
    }
    if (activityTier) {
      whereConditions.push(`dc.activity_tier = $${pIdx++}`);
      params.push(activityTier);
    }
    if (year) {
      whereConditions.push(`dt.year = $${pIdx++}`);
      params.push(parseInt(year, 10));
    }
    if (quarter) {
      whereConditions.push(`dt.quarter = $${pIdx++}`);
      params.push(parseInt(quarter, 10));
    }
    if (month) {
      whereConditions.push(`dt.month = $${pIdx++}`);
      params.push(parseInt(month, 10));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 2. Query Summary KPIs for this diced subset
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(fs.total_revenue), 0) AS total_gross_revenue,
        COALESCE(SUM(fs.discount_amount), 0) AS total_discounts,
        COALESCE(SUM(fs.net_revenue), 0) AS total_net_revenue,
        COALESCE(SUM(fs.quantity_sold), 0) AS total_units_sold,
        COUNT(DISTINCT fs.order_id) AS total_orders_count,
        COUNT(DISTINCT fs.customer_id) AS active_customers_count,
        COUNT(DISTINCT fs.product_id) AS products_transacted_count,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT fs.order_id) > 0 THEN COALESCE(SUM(fs.net_revenue), 0) / COUNT(DISTINCT fs.order_id)
            ELSE 0 
          END, 2
        ) AS average_order_value
      FROM fact_sales fs
      JOIN dim_time dt ON fs.time_id = dt.time_id
      JOIN dim_product dp ON fs.product_id = dp.product_id
      LEFT JOIN dim_customer dc ON fs.customer_id = dc.customer_id
      ${whereClause};
    `;

    // 3. Query Time-Series Trend for this diced subset based on timeGrain
    let timeSelect = '';
    let timeGroupBy = '';
    let timeOrderBy = '';

    switch ((timeGrain || 'month').toLowerCase()) {
      case 'day':
        timeSelect = `dt.full_date AS period_key, TO_CHAR(dt.full_date, 'YYYY-MM-DD') AS period_label`;
        timeGroupBy = `dt.full_date`;
        timeOrderBy = `dt.full_date ASC`;
        break;
      case 'week':
        timeSelect = `TO_CHAR(DATE_TRUNC('week', dt.full_date)::date, 'IYYY-"W"IW') AS period_key, TO_CHAR(DATE_TRUNC('week', dt.full_date)::date, '"Wk "IW (IYYY)') AS period_label`;
        timeGroupBy = `DATE_TRUNC('week', dt.full_date)::date`;
        timeOrderBy = `DATE_TRUNC('week', dt.full_date)::date ASC`;
        break;
      case 'quarter':
        timeSelect = `CONCAT(dt.year, '-Q', dt.quarter) AS period_key, CONCAT(dt.quarter_name, ' ', dt.year) AS period_label`;
        timeGroupBy = `dt.year, dt.quarter, dt.quarter_name`;
        timeOrderBy = `dt.year ASC, dt.quarter ASC`;
        break;
      case 'year':
        timeSelect = `dt.year::text AS period_key, dt.year::text AS period_label`;
        timeGroupBy = `dt.year`;
        timeOrderBy = `dt.year ASC`;
        break;
      case 'month':
      default:
        timeSelect = `CONCAT(dt.year, '-', LPAD(dt.month::text, 2, '0')) AS period_key, CONCAT(dt.month_short_name, ' ', dt.year) AS period_label`;
        timeGroupBy = `dt.year, dt.month, dt.month_short_name`;
        timeOrderBy = `dt.year ASC, dt.month ASC`;
        break;
    }

    const timeSeriesQuery = `
      SELECT 
        ${timeSelect},
        COALESCE(SUM(fs.net_revenue), 0) AS net_revenue,
        COALESCE(SUM(fs.total_revenue), 0) AS gross_revenue,
        COALESCE(SUM(fs.quantity_sold), 0) AS units_sold,
        COUNT(DISTINCT fs.order_id) AS order_count
      FROM fact_sales fs
      JOIN dim_time dt ON fs.time_id = dt.time_id
      JOIN dim_product dp ON fs.product_id = dp.product_id
      LEFT JOIN dim_customer dc ON fs.customer_id = dc.customer_id
      ${whereClause}
      GROUP BY ${timeGroupBy}
      ORDER BY ${timeOrderBy};
    `;

    // 4. Query OLAP Multi-Dimensional CUBE / ROLLUP Cells
    let cubeQuery = '';
    if (cubeMode === 'rollup') {
      cubeQuery = `
        SELECT 
          dt.year::text AS dim_1,
          dt.quarter_name AS dim_2,
          dt.month_short_name AS dim_3,
          'Temporal Rollup' AS cube_type,
          GROUPING(dt.year) AS is_dim1_subtotal,
          GROUPING(dt.quarter_name) AS is_dim2_subtotal,
          GROUPING(dt.month_short_name) AS is_dim3_subtotal,
          (GROUPING(dt.year) + GROUPING(dt.quarter_name) + GROUPING(dt.month_short_name)) AS aggregation_level,
          COALESCE(SUM(fs.net_revenue), 0) AS net_revenue,
          COALESCE(SUM(fs.total_revenue), 0) AS gross_revenue,
          COALESCE(SUM(fs.quantity_sold), 0) AS units_sold,
          COUNT(DISTINCT fs.order_id) AS order_count,
          COUNT(DISTINCT fs.customer_id) AS customer_count
        FROM fact_sales fs
        JOIN dim_time dt ON fs.time_id = dt.time_id
        JOIN dim_product dp ON fs.product_id = dp.product_id
        LEFT JOIN dim_customer dc ON fs.customer_id = dc.customer_id
        ${whereClause}
        GROUP BY ROLLUP (dt.year, dt.quarter_name, dt.month_short_name)
        ORDER BY dt.year NULLS LAST, dt.quarter_name NULLS LAST, dt.month_short_name NULLS LAST;
      `;
    } else if (cubeMode === 'customer_cube') {
      cubeQuery = `
        SELECT 
          COALESCE(dc.activity_tier, 'ALL CUSTOMER TIERS') AS dim_1,
          COALESCE(dp.category_name, 'ALL CATEGORIES') AS dim_2,
          NULL AS dim_3,
          'Customer-Product Cube' AS cube_type,
          GROUPING(dc.activity_tier) AS is_dim1_subtotal,
          GROUPING(dp.category_name) AS is_dim2_subtotal,
          0 AS is_dim3_subtotal,
          (GROUPING(dc.activity_tier) + GROUPING(dp.category_name)) AS aggregation_level,
          COALESCE(SUM(fs.net_revenue), 0) AS net_revenue,
          COALESCE(SUM(fs.total_revenue), 0) AS gross_revenue,
          COALESCE(SUM(fs.quantity_sold), 0) AS units_sold,
          COUNT(DISTINCT fs.order_id) AS order_count,
          COUNT(DISTINCT fs.customer_id) AS customer_count
        FROM fact_sales fs
        JOIN dim_time dt ON fs.time_id = dt.time_id
        JOIN dim_product dp ON fs.product_id = dp.product_id
        LEFT JOIN dim_customer dc ON fs.customer_id = dc.customer_id
        ${whereClause}
        GROUP BY CUBE (dc.activity_tier, dp.category_name)
        ORDER BY is_dim1_subtotal ASC, is_dim2_subtotal ASC, net_revenue DESC;
      `;
    } else if (cubeMode === 'slice') {
      cubeQuery = `
        SELECT 
          dp.category_name AS dim_1,
          dp.price_tier AS dim_2,
          dt.quarter_name AS dim_3,
          'Filtered Flat Slice' AS cube_type,
          0 AS is_dim1_subtotal,
          0 AS is_dim2_subtotal,
          0 AS is_dim3_subtotal,
          0 AS aggregation_level,
          COALESCE(SUM(fs.net_revenue), 0) AS net_revenue,
          COALESCE(SUM(fs.total_revenue), 0) AS gross_revenue,
          COALESCE(SUM(fs.quantity_sold), 0) AS units_sold,
          COUNT(DISTINCT fs.order_id) AS order_count,
          COUNT(DISTINCT fs.customer_id) AS customer_count
        FROM fact_sales fs
        JOIN dim_time dt ON fs.time_id = dt.time_id
        JOIN dim_product dp ON fs.product_id = dp.product_id
        LEFT JOIN dim_customer dc ON fs.customer_id = dc.customer_id
        ${whereClause}
        GROUP BY dp.category_name, dp.price_tier, dt.quarter_name
        ORDER BY net_revenue DESC;
      `;
    } else {
      // Default: Product Hierarchy CUBE (Category x Price Tier)
      cubeQuery = `
        SELECT 
          COALESCE(dp.category_name, 'ALL CATEGORIES') AS dim_1,
          COALESCE(dp.price_tier, 'ALL PRICE TIERS') AS dim_2,
          NULL AS dim_3,
          'Category-PriceTier Cube' AS cube_type,
          GROUPING(dp.category_name) AS is_dim1_subtotal,
          GROUPING(dp.price_tier) AS is_dim2_subtotal,
          0 AS is_dim3_subtotal,
          (GROUPING(dp.category_name) + GROUPING(dp.price_tier)) AS aggregation_level,
          COALESCE(SUM(fs.net_revenue), 0) AS net_revenue,
          COALESCE(SUM(fs.total_revenue), 0) AS gross_revenue,
          COALESCE(SUM(fs.quantity_sold), 0) AS units_sold,
          COUNT(DISTINCT fs.order_id) AS order_count,
          COUNT(DISTINCT fs.customer_id) AS customer_count
        FROM fact_sales fs
        JOIN dim_time dt ON fs.time_id = dt.time_id
        JOIN dim_product dp ON fs.product_id = dp.product_id
        LEFT JOIN dim_customer dc ON fs.customer_id = dc.customer_id
        ${whereClause}
        GROUP BY CUBE (dp.category_name, dp.price_tier)
        ORDER BY is_dim1_subtotal ASC, is_dim2_subtotal ASC, net_revenue DESC;
      `;
    }

    // 5. Query Cross-Tabulation Pivot Data (Category x Price Tier Matrix or Customer Tier x Category Matrix)
    const isCustomerCube = cubeMode === 'customer_cube';
    const pivotRowCol = isCustomerCube
      ? `COALESCE(dc.activity_tier, 'UNASSIGNED') AS row_dim, dp.category_name AS col_dim, dp.category_name, 'ALL'::varchar AS price_tier`
      : `dp.category_name AS row_dim, dp.price_tier AS col_dim, dp.category_name, dp.price_tier`;
    const pivotGroupBy = isCustomerCube
      ? `dc.activity_tier, dp.category_name`
      : `dp.category_name, dp.price_tier`;

    const pivotQuery = `
      SELECT 
        ${pivotRowCol},
        COALESCE(SUM(fs.net_revenue), 0) AS net_revenue,
        COALESCE(SUM(fs.quantity_sold), 0) AS units_sold,
        COUNT(DISTINCT fs.order_id) AS order_count
      FROM fact_sales fs
      JOIN dim_time dt ON fs.time_id = dt.time_id
      JOIN dim_product dp ON fs.product_id = dp.product_id
      LEFT JOIN dim_customer dc ON fs.customer_id = dc.customer_id
      ${whereClause}
      GROUP BY ${pivotGroupBy}
      ORDER BY 1, 2;
    `;

    const [summaryRes, timeSeriesRes, cubeRes, pivotRes] = await Promise.all([
      query(summaryQuery, params),
      query(timeSeriesQuery, params),
      query(cubeQuery, params),
      query(pivotQuery, params)
    ]);

    return {
      summary: summaryRes.rows[0] || {},
      timeSeries: timeSeriesRes.rows || [],
      cubeCells: cubeRes.rows || [],
      pivotData: pivotRes.rows || [],
      executedQuery: {
        cubeMode,
        timeGrain,
        filterCount: whereConditions.length
      }
    };
  }
};
