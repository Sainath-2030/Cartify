import { query, settleLimit } from '../../config/db.js';

/**
 * Section 6: Data Quality Auditing, Governance & Lineage Engine
 * 
 * Provides:
 * 1. Self-healing schema initialization for audit tables (etl_data_lineage, data_quality_audits)
 * 2. Multi-tier Architectural Data Lineage DAG generation & live record sync
 * 3. Multi-dimensional automated Data Quality Scoring:
 *    - Completeness: Non-null attribute ratio across dimensions and facts
 *    - Consistency: Referential integrity, orphan detection, and mathematical balance
 *    - Timeliness: Ingestion latency, freshness SLA evaluation, and throughput
 * 4. Composite Data Quality Index (DQI) calculation and audit log persistence
 */
export const dataQualityService = {
  /**
   * Ensure Section 6 tables exist in PostgreSQL
   */
  async ensureTablesExist() {
    await query(`
      CREATE TABLE IF NOT EXISTS etl_job_runs (
        job_id BIGSERIAL PRIMARY KEY,
        job_name VARCHAR(100) NOT NULL,
        records_extracted INT DEFAULT 0 NOT NULL,
        records_transformed INT DEFAULT 0 NOT NULL,
        records_loaded INT DEFAULT 0 NOT NULL,
        execution_time_ms INT DEFAULT 0 NOT NULL,
        status VARCHAR(30) DEFAULT 'SUCCESS' NOT NULL,
        details JSONB DEFAULT '{}'::jsonb NOT NULL,
        error_message TEXT,
        started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS etl_data_lineage (
        lineage_id BIGSERIAL PRIMARY KEY,
        tier VARCHAR(50) NOT NULL,
        node_id VARCHAR(100) UNIQUE NOT NULL,
        node_label VARCHAR(150) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        description TEXT,
        record_count BIGINT DEFAULT 0,
        upstream_nodes JSONB DEFAULT '[]'::jsonb,
        downstream_nodes JSONB DEFAULT '[]'::jsonb,
        transformation_logic TEXT,
        last_synced_at TIMESTAMPTZ DEFAULT NOW(),
        health_status VARCHAR(30) DEFAULT 'HEALTHY',
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS data_quality_audits (
        audit_id BIGSERIAL PRIMARY KEY,
        overall_score NUMERIC(5,2) NOT NULL,
        completeness_score NUMERIC(5,2) NOT NULL,
        consistency_score NUMERIC(5,2) NOT NULL,
        timeliness_score NUMERIC(5,2) NOT NULL,
        status VARCHAR(30) DEFAULT 'EXCELLENT' NOT NULL,
        summary JSONB DEFAULT '{}'::jsonb NOT NULL,
        checks JSONB DEFAULT '[]'::jsonb NOT NULL,
        table_breakdown JSONB DEFAULT '[]'::jsonb NOT NULL,
        audited_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);
  },

  /**
   * Run automated Data Quality Audit across Star Schema & OLTP tables
   */
  async runQualityAudit() {
    await this.ensureTablesExist();

    // 1. COMPLETENESS EVALUATION (Non-null attribute ratios)
    const completenessChecks = [
      {
        table: 'dim_product',
        columns: ['product_id', 'title', 'brand', 'category_id', 'category_name', 'price_tier']
      },
      {
        table: 'dim_customer',
        columns: ['customer_id', 'account_age_days', 'activity_tier']
      },
      {
        table: 'dim_time',
        columns: ['time_id', 'full_date', 'year', 'quarter', 'month', 'month_name', 'day', 'day_name']
      },
      {
        table: 'fact_sales',
        columns: ['fact_id', 'time_id', 'product_id', 'customer_id', 'quantity_sold', 'unit_price', 'total_revenue', 'net_revenue']
      },
      {
        table: 'fact_interaction_daily',
        columns: ['fact_id', 'time_id', 'product_id', 'category_id', 'view_count', 'cart_count', 'purchase_count', 'total_interactions']
      }
    ];

    const tableCompletenessBreakdown = [];
    let totalAttributesCounted = 0;
    let totalNonNullAttributes = 0;

    for (const check of completenessChecks) {
      try {
        const countRes = await query(`SELECT count(*) as total_rows FROM ${check.table}`);
        const totalRows = parseInt(countRes.rows[0].total_rows, 10);

        if (totalRows === 0) {
          tableCompletenessBreakdown.push({
            table: check.table,
            totalRows: 0,
            columnScores: check.columns.map(col => ({ column: col, nullCount: 0, nonNullRate: 100 })),
            tableScore: 100
          });
          continue;
        }

        const selectParts = check.columns.map(col => `COUNT(${col}) AS non_null_${col}`).join(', ');
        const nullRes = await query(`SELECT ${selectParts} FROM ${check.table}`);
        const row = nullRes.rows[0];

        const columnScores = [];
        let tableNonNullSum = 0;
        const tablePossibleCells = totalRows * check.columns.length;

        for (const col of check.columns) {
          const nonNullCount = parseInt(row[`non_null_${col}`] || 0, 10);
          const nullCount = totalRows - nonNullCount;
          const nonNullRate = totalRows > 0 ? parseFloat(((nonNullCount / totalRows) * 100).toFixed(2)) : 100;
          columnScores.push({
            column: col,
            nullCount,
            nonNullCount,
            nonNullRate
          });
          tableNonNullSum += nonNullCount;
        }

        const tableScore = tablePossibleCells > 0 ? parseFloat(((tableNonNullSum / tablePossibleCells) * 100).toFixed(2)) : 100;

        tableCompletenessBreakdown.push({
          table: check.table,
          totalRows,
          columnScores,
          tableScore
        });

        totalAttributesCounted += tablePossibleCells;
        totalNonNullAttributes += tableNonNullSum;
      } catch (err) {
        console.warn(`[DataQuality] Completeness check error on ${check.table}:`, err.message);
      }
    }

    const completenessScore = totalAttributesCounted > 0
      ? parseFloat(((totalNonNullAttributes / totalAttributesCounted) * 100).toFixed(2))
      : 100;

    // 2. CONSISTENCY & REFERENTIAL INTEGRITY EVALUATION
    const consistencyRules = [];

    // Rule A: Fact Sales -> Dim Product Orphan Check
    const prodOrphanRes = await query(`
      SELECT COUNT(*) as orphans
      FROM fact_sales fs
      LEFT JOIN dim_product dp ON fs.product_id = dp.product_id
      WHERE dp.product_id IS NULL;
    `);
    const prodOrphans = parseInt(prodOrphanRes.rows[0].orphans, 10);
    consistencyRules.push({
      ruleId: 'CONS_REF_PROD',
      title: 'Fact Sales Product Referential Integrity',
      description: 'Ensures all product_ids referenced in Fact_Sales exist in Dim_Product dimension.',
      passed: prodOrphans === 0,
      violations: prodOrphans,
      weight: 20
    });

    // Rule B: Fact Sales -> Dim Customer Orphan Check
    const custOrphanRes = await query(`
      SELECT COUNT(*) as orphans
      FROM fact_sales fs
      LEFT JOIN dim_customer dc ON fs.customer_id = dc.customer_id
      WHERE dc.customer_id IS NULL;
    `);
    const custOrphans = parseInt(custOrphanRes.rows[0].orphans, 10);
    consistencyRules.push({
      ruleId: 'CONS_REF_CUST',
      title: 'Fact Sales Customer Referential Integrity',
      description: 'Ensures all customer_ids referenced in Fact_Sales exist in Dim_Customer dimension.',
      passed: custOrphans === 0,
      violations: custOrphans,
      weight: 20
    });

    // Rule C: Fact Sales -> Dim Time Orphan Check
    const timeOrphanRes = await query(`
      SELECT COUNT(*) as orphans
      FROM fact_sales fs
      LEFT JOIN dim_time dt ON fs.time_id = dt.time_id
      WHERE dt.time_id IS NULL;
    `);
    const timeOrphans = parseInt(timeOrphanRes.rows[0].orphans, 10);
    consistencyRules.push({
      ruleId: 'CONS_REF_TIME',
      title: 'Fact Sales Temporal Dimension Integrity',
      description: 'Ensures all time_ids referenced in Fact_Sales exist in Dim_Time calendar dimension.',
      passed: timeOrphans === 0,
      violations: timeOrphans,
      weight: 20
    });

    // Rule D: Fact Interaction Daily -> Dim Product Integrity
    const intProdOrphanRes = await query(`
      SELECT COUNT(*) as orphans
      FROM fact_interaction_daily fi
      LEFT JOIN dim_product dp ON fi.product_id = dp.product_id
      WHERE dp.product_id IS NULL;
    `);
    const intProdOrphans = parseInt(intProdOrphanRes.rows[0].orphans, 10);
    consistencyRules.push({
      ruleId: 'CONS_REF_INT_PROD',
      title: 'Telemetry Fact Product Referential Integrity',
      description: 'Ensures all telemetry aggregate product_ids resolve to valid Dim_Product records.',
      passed: intProdOrphans === 0,
      violations: intProdOrphans,
      weight: 15
    });

    // Rule E: Financial Balance Formula Check (net_revenue == total_revenue - discount_amount)
    const mathMismatchRes = await query(`
      SELECT COUNT(*) as mismatches
      FROM fact_sales
      WHERE ABS((total_revenue - discount_amount) - net_revenue) > 0.02;
    `);
    const mathMismatches = parseInt(mathMismatchRes.rows[0].mismatches, 10);
    consistencyRules.push({
      ruleId: 'CONS_MATH_BALANCE',
      title: 'Fact Sales Revenue Reconciliation Math',
      description: 'Validates that net_revenue precisely equals total_revenue minus discount_amount (tolerance < $0.02).',
      passed: mathMismatches === 0,
      violations: mathMismatches,
      weight: 15
    });

    // Rule F: Non-Negative Values Domain Check
    const negativeRes = await query(`
      SELECT COUNT(*) as negative_counts
      FROM fact_sales
      WHERE quantity_sold < 0 OR unit_price < 0 OR total_revenue < 0 OR net_revenue < 0;
    `);
    const negativeCounts = parseInt(negativeRes.rows[0].negative_counts, 10);
    consistencyRules.push({
      ruleId: 'CONS_DOMAIN_NON_NEGATIVE',
      title: 'Domain Range Non-Negativity Invariant',
      description: 'Validates that quantities, prices, and revenue amounts in fact_sales are strictly non-negative.',
      passed: negativeCounts === 0,
      violations: negativeCounts,
      weight: 10
    });

    let consistencyScoreSum = 0;
    let consistencyWeightSum = 0;
    for (const rule of consistencyRules) {
      consistencyWeightSum += rule.weight;
      if (rule.passed) {
        consistencyScoreSum += rule.weight;
      }
    }
    const consistencyScore = consistencyWeightSum > 0
      ? parseFloat(((consistencyScoreSum / consistencyWeightSum) * 100).toFixed(2))
      : 100;

    // 3. TIMELINESS & FRESHNESS EVALUATION
    let timelinessScore = 100;
    let syncAgeMinutes = 0;
    let latestJob = null;
    let operationalOrderCount = 0;
    let warehouseFactCount = 0;
    let operationalLatencyHours = 0;

    try {
      const latestJobRes = await query(`
        SELECT * FROM etl_job_runs 
        ORDER BY started_at DESC 
        LIMIT 1;
      `);
      latestJob = latestJobRes.rows[0] || null;

      if (latestJob && latestJob.completed_at) {
        const completedAt = new Date(latestJob.completed_at);
        syncAgeMinutes = Math.max(0, Math.floor((Date.now() - completedAt.getTime()) / (1000 * 60)));
      } else if (latestJob && latestJob.started_at) {
        const startedAt = new Date(latestJob.started_at);
        syncAgeMinutes = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60)));
      }

      // Check max operational order timestamp vs current time
      const maxOrderRes = await query(`SELECT MAX(created_at) as max_order_date, count(*) as cnt FROM orders;`);
      const maxOrderDate = maxOrderRes.rows[0]?.max_order_date;
      operationalOrderCount = parseInt(maxOrderRes.rows[0]?.cnt || 0, 10);

      const factCountRes = await query(`SELECT COUNT(DISTINCT order_id) as cnt FROM fact_sales;`);
      warehouseFactCount = parseInt(factCountRes.rows[0]?.cnt || 0, 10);

      if (maxOrderDate) {
        const orderTime = new Date(maxOrderDate);
        operationalLatencyHours = parseFloat(((Date.now() - orderTime.getTime()) / (1000 * 60 * 60)).toFixed(1));
      }

      // Freshness SLA Grading:
      // - syncAge <= 60 mins: 100%
      // - syncAge <= 360 mins (6h): 95%
      // - syncAge <= 1440 mins (24h): 90%
      // - syncAge <= 2880 mins (48h): 80%
      // - syncAge <= 10080 mins (7 days): 70%
      // - older: 60%
      if (syncAgeMinutes <= 60) {
        timelinessScore = 100;
      } else if (syncAgeMinutes <= 360) {
        timelinessScore = 95;
      } else if (syncAgeMinutes <= 1440) {
        timelinessScore = 90;
      } else if (syncAgeMinutes <= 2880) {
        timelinessScore = 80;
      } else if (syncAgeMinutes <= 10080) {
        timelinessScore = 70;
      } else {
        timelinessScore = 60;
      }
    } catch (err) {
      console.warn('[DataQuality] Timeliness computation notice:', err.message);
      timelinessScore = 90;
    }

    // 4. COMPOSITE DATA QUALITY INDEX (DQI)
    // Formula: 40% Completeness + 35% Consistency + 25% Timeliness
    const overallScore = parseFloat(
      (0.40 * completenessScore + 0.35 * consistencyScore + 0.25 * timelinessScore).toFixed(2)
    );

    let status = 'EXCELLENT';
    if (overallScore < 70) {
      status = 'CRITICAL';
    } else if (overallScore < 80) {
      status = 'WARNING';
    } else if (overallScore < 90) {
      status = 'GOOD';
    }

    const summary = {
      overallScore,
      completenessScore,
      consistencyScore,
      timelinessScore,
      status,
      syncAgeMinutes,
      operationalLatencyHours,
      operationalOrderCount,
      warehouseFactCount,
      latestJobStatus: latestJob?.status || 'UNKNOWN',
      latestJobDurationMs: latestJob?.execution_time_ms || 0,
      latestJobTimestamp: latestJob?.completed_at || latestJob?.started_at || null
    };

    // 5. PERSIST AUDIT RECORD
    try {
      await query(`
        INSERT INTO data_quality_audits (
          overall_score, completeness_score, consistency_score, timeliness_score,
          status, summary, checks, table_breakdown, audited_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());
      `, [
        overallScore,
        completenessScore,
        consistencyScore,
        timelinessScore,
        status,
        JSON.stringify(summary),
        JSON.stringify(consistencyRules),
        JSON.stringify(tableCompletenessBreakdown)
      ]);
    } catch (persistErr) {
      console.warn('[DataQuality] Failed to persist quality audit log:', persistErr.message);
    }

    return {
      summary,
      consistencyRules,
      tableCompletenessBreakdown,
      auditedAt: new Date().toISOString()
    };
  },

  /**
   * Get latest Data Quality Report along with historical DQI trend
   */
  async getDataQualityReport() {
    await this.ensureTablesExist();

    // Retrieve latest audit or run one if none exists
    const latestRes = await query(`
      SELECT * FROM data_quality_audits 
      ORDER BY audited_at DESC 
      LIMIT 1;
    `);

    let report;
    if (latestRes.rows.length === 0) {
      report = await this.runQualityAudit();
    } else {
      const row = latestRes.rows[0];
      report = {
        summary: row.summary,
        consistencyRules: row.checks,
        tableCompletenessBreakdown: row.table_breakdown,
        auditedAt: row.audited_at
      };
    }

    // Historical audit trend (up to last 15 audits)
    const historyRes = await query(`
      SELECT audit_id, overall_score, completeness_score, consistency_score, timeliness_score, status, audited_at
      FROM data_quality_audits
      ORDER BY audited_at DESC
      LIMIT 15;
    `);

    // Recent ETL Job runs
    // Wrapped defensively: if the audit table is missing or briefly unavailable,
    // the caller should still receive the quality report and simply see an
    // empty audit list rather than the whole governance panel failing.
    let recentEtlRuns = [];
    try {
      const etlRunsRes = await query(`
        SELECT 
          job_id, job_name, records_extracted, records_transformed, records_loaded,
          execution_time_ms, status, details, error_message, started_at, completed_at
        FROM etl_job_runs
        ORDER BY started_at DESC
        LIMIT 10;
      `);
      recentEtlRuns = etlRunsRes.rows;
    } catch (err) {
      console.warn('[DataQuality] Failed to read ETL job runs:', err.message);
    }

    return {
      ...report,
      auditHistory: historyRes.rows.reverse(),
      recentEtlRuns
    };
  },

  /**
   * Data Lineage Graph Engine:
   * Generates 4-Tier Directed Acyclic Graph (DAG) with live record counts & dependencies
   */
  async getDataLineageGraph() {
    await this.ensureTablesExist();

    // Query live record counts across all operational and warehouse tables
    const [
      usersRes,
      prodsRes,
      ordersRes,
      itemsRes,
      interRes,
      revRes,
      dimTimeRes,
      dimProdRes,
      dimCustRes,
      factSalesRes,
      factIntRes
    // Eleven row-count scans. Firing all of them concurrently is what pushed the
    // database past its connection cap when the governance tab loaded alongside
    // the other panels, so they run three at a time.
    ] = await settleLimit([
      () => query(`SELECT count(*) FROM users;`),
      () => query(`SELECT count(*) FROM products;`),
      () => query(`SELECT count(*) FROM orders;`),
      () => query(`SELECT count(*) FROM order_items;`),
      () => query(`SELECT count(*) FROM interactions;`),
      () => query(`SELECT count(*) FROM reviews;`),
      () => query(`SELECT count(*) FROM dim_time;`),
      () => query(`SELECT count(*) FROM dim_product;`),
      () => query(`SELECT count(*) FROM dim_customer;`),
      () => query(`SELECT count(*) FROM fact_sales;`),
      () => query(`SELECT count(*) FROM fact_interaction_daily;`)
    ], 3);

    const counts = {
      users: parseInt(usersRes.rows[0].count, 10),
      products: parseInt(prodsRes.rows[0].count, 10),
      orders: parseInt(ordersRes.rows[0].count, 10),
      orderItems: parseInt(itemsRes.rows[0].count, 10),
      interactions: parseInt(interRes.rows[0].count, 10),
      reviews: parseInt(revRes.rows[0].count, 10),
      dimTime: parseInt(dimTimeRes.rows[0].count, 10),
      dimProduct: parseInt(dimProdRes.rows[0].count, 10),
      dimCustomer: parseInt(dimCustRes.rows[0].count, 10),
      factSales: parseInt(factSalesRes.rows[0].count, 10),
      factInteraction: parseInt(factIntRes.rows[0].count, 10)
    };

    // Define Canonical 4-Tier Architecture Nodes
    const nodes = [
      // TIER 1: OPERATIONAL SOURCE (OLTP)
      {
        id: 'src_users',
        label: 'users',
        tier: 'Tier 1: OLTP Sources',
        tierIndex: 1,
        entityType: 'TABLE',
        database: 'PostgreSQL 3NF',
        recordCount: counts.users,
        description: 'Normalized customer master table storing credentials, profiles, and registration timestamps.',
        healthStatus: 'HEALTHY',
        schema: ['id', 'email', 'full_name', 'role', 'created_at']
      },
      {
        id: 'src_products',
        label: 'products',
        tier: 'Tier 1: OLTP Sources',
        tierIndex: 1,
        entityType: 'TABLE',
        database: 'PostgreSQL 3NF',
        recordCount: counts.products,
        description: 'Operational product catalog with titles, category foreign keys, stock levels, and base pricing.',
        healthStatus: 'HEALTHY',
        schema: ['id', 'title', 'brand', 'category_id', 'price', 'rating', 'created_at']
      },
      {
        id: 'src_orders',
        label: 'orders',
        tier: 'Tier 1: OLTP Sources',
        tierIndex: 1,
        entityType: 'TABLE',
        database: 'PostgreSQL 3NF',
        recordCount: counts.orders,
        description: 'Transactional header records storing user order IDs, statuses, and gross amounts.',
        healthStatus: 'HEALTHY',
        schema: ['id', 'user_id', 'total_amount', 'status', 'created_at']
      },
      {
        id: 'src_order_items',
        label: 'order_items',
        tier: 'Tier 1: OLTP Sources',
        tierIndex: 1,
        entityType: 'TABLE',
        database: 'PostgreSQL 3NF',
        recordCount: counts.orderItems,
        description: 'Normalized line-item details capturing item quantities, per-item prices, and discounts.',
        healthStatus: 'HEALTHY',
        schema: ['id', 'order_id', 'product_id', 'quantity', 'price']
      },
      {
        id: 'src_interactions',
        label: 'interactions',
        tier: 'Tier 1: OLTP Sources',
        tierIndex: 1,
        entityType: 'TABLE',
        database: 'PostgreSQL 3NF',
        recordCount: counts.interactions,
        description: 'Real-time telemetry event stream (VIEW, SEARCH, CART_ADD, WISHLIST_ADD, PURCHASE).',
        healthStatus: 'HEALTHY',
        schema: ['id', 'user_id', 'product_id', 'interaction_type', 'session_id', 'created_at']
      },
      {
        id: 'src_reviews',
        label: 'reviews',
        tier: 'Tier 1: OLTP Sources',
        tierIndex: 1,
        entityType: 'TABLE',
        database: 'PostgreSQL 3NF',
        recordCount: counts.reviews,
        description: 'Customer product reviews, star ratings, feedback commentary, and sentiment vectors.',
        healthStatus: 'HEALTHY',
        schema: ['id', 'user_id', 'product_id', 'rating', 'review_text', 'created_at']
      },

      // TIER 2: ETL & TRANSFORMATION PROCESSES
      {
        id: 'etl_time_gen',
        label: 'Dim_Time Generator',
        tier: 'Tier 2: ETL & Transform',
        tierIndex: 2,
        entityType: 'PROCESS',
        database: 'Node.js ETL Engine',
        recordCount: counts.dimTime,
        description: 'Generates continuous date records with calendar attributes, ISO weeks, quarters, and weekend flags.',
        transformationLogic: 'Surrogate key via toTimeId(YYYYMMDD). Extracts year, quarter, month, day_of_week.',
        healthStatus: 'HEALTHY'
      },
      {
        id: 'etl_prod_norm',
        label: 'Dim_Product Normalizer',
        tier: 'Tier 2: ETL & Transform',
        tierIndex: 2,
        entityType: 'PROCESS',
        database: 'Node.js ETL Engine',
        recordCount: counts.dimProduct,
        description: 'Enriches raw products with category names and dynamic price tiers (BUDGET, MID_RANGE, PREMIUM, LUXURY).',
        transformationLogic: 'Imputes missing brands as "Generic", resolves categories, and assigns price tier bins.',
        healthStatus: 'HEALTHY'
      },
      {
        id: 'etl_rfm_cust',
        label: 'Customer RFM Pipeline',
        tier: 'Tier 2: ETL & Transform',
        tierIndex: 2,
        entityType: 'PROCESS',
        database: 'Node.js ETL Engine',
        recordCount: counts.dimCustomer,
        description: 'Calculates customer account age and assigns activity tiers (INACTIVE, OCCASIONAL, REGULAR, POWER_BUYER).',
        transformationLogic: 'Aggregates user order frequency & recency. Assigns discrete activity tier classification.',
        healthStatus: 'HEALTHY'
      },
      {
        id: 'etl_sales_denorm',
        label: 'Fact_Sales Denormalizer',
        tier: 'Tier 2: ETL & Transform',
        tierIndex: 2,
        entityType: 'PROCESS',
        database: 'Node.js ETL Engine',
        recordCount: counts.factSales,
        description: 'Joins orders with line items and dimension keys to calculate net revenue and financial metrics.',
        transformationLogic: 'Net Revenue = Total Revenue - Discount. Links to dim_time, dim_product, dim_customer.',
        healthStatus: 'HEALTHY'
      },
      {
        id: 'etl_telemetry_agg',
        label: 'Telemetry Daily Aggregator',
        tier: 'Tier 2: ETL & Transform',
        tierIndex: 2,
        entityType: 'PROCESS',
        database: 'Node.js ETL Engine',
        recordCount: counts.factInteraction,
        description: 'Rolls up raw clickstream interactions into daily product-category aggregates.',
        transformationLogic: 'GROUP BY DATE(created_at), product_id, category_id with conditional counts.',
        healthStatus: 'HEALTHY'
      },

      // TIER 3: STAR SCHEMA DATA WAREHOUSE (OLAP)
      {
        id: 'wh_dim_time',
        label: 'dim_time',
        tier: 'Tier 3: Star Schema DW',
        tierIndex: 3,
        entityType: 'DIMENSION',
        database: 'Data Warehouse (OLAP)',
        recordCount: counts.dimTime,
        description: 'Temporal Dimension providing temporal hierarchies (Year -> Quarter -> Month -> Week -> Day).',
        healthStatus: 'HEALTHY',
        schema: ['time_id', 'full_date', 'year', 'quarter', 'month', 'month_name', 'day', 'day_name', 'is_weekend']
      },
      {
        id: 'wh_dim_product',
        label: 'dim_product',
        tier: 'Tier 3: Star Schema DW',
        tierIndex: 3,
        entityType: 'DIMENSION',
        database: 'Data Warehouse (OLAP)',
        recordCount: counts.dimProduct,
        description: 'Product Dimension with category hierarchies and price tier classifications.',
        healthStatus: 'HEALTHY',
        schema: ['product_id', 'title', 'brand', 'category_id', 'category_name', 'price_tier']
      },
      {
        id: 'wh_dim_customer',
        label: 'dim_customer',
        tier: 'Tier 3: Star Schema DW',
        tierIndex: 3,
        entityType: 'DIMENSION',
        database: 'Data Warehouse (OLAP)',
        recordCount: counts.dimCustomer,
        description: 'Customer Dimension with behavioral activity tiers and tenure metrics.',
        healthStatus: 'HEALTHY',
        schema: ['customer_id', 'created_at', 'account_age_days', 'activity_tier']
      },
      {
        id: 'wh_fact_sales',
        label: 'fact_sales',
        tier: 'Tier 3: Star Schema DW',
        tierIndex: 3,
        entityType: 'FACT',
        database: 'Data Warehouse (OLAP)',
        recordCount: counts.factSales,
        description: 'Central Transactional Fact Table at order-line grain with foreign keys to all dimensions.',
        healthStatus: 'HEALTHY',
        schema: ['fact_id', 'time_id', 'product_id', 'customer_id', 'order_id', 'quantity_sold', 'unit_price', 'total_revenue', 'discount_amount', 'net_revenue']
      },
      {
        id: 'wh_fact_interaction_daily',
        label: 'fact_interaction_daily',
        tier: 'Tier 3: Star Schema DW',
        tierIndex: 3,
        entityType: 'FACT',
        database: 'Data Warehouse (OLAP)',
        recordCount: counts.factInteraction,
        description: 'Pre-aggregated Event Fact Table for high-throughput daily telemetry slicing.',
        healthStatus: 'HEALTHY',
        schema: ['fact_id', 'time_id', 'product_id', 'category_id', 'view_count', 'search_count', 'cart_count', 'wishlist_count', 'purchase_count', 'total_interactions']
      },

      // TIER 4: ANALYTICS & DATA MINING CONSUMERS
      {
        id: 'cons_bi_dashboard',
        label: 'Executive BI Dashboard',
        tier: 'Tier 4: Analytics & Mining',
        tierIndex: 4,
        entityType: 'CONSUMER',
        database: 'React BI Console',
        description: 'Executive top-level KPI tracking, sales trends, and cross-category performance.',
        healthStatus: 'ACTIVE'
      },
      {
        id: 'cons_olap_cube',
        label: 'OLAP Slice & Dice Engine',
        tier: 'Tier 4: Analytics & Mining',
        tierIndex: 4,
        entityType: 'CONSUMER',
        database: 'SQL CUBE & ROLLUP',
        description: 'Interactive multidimensional cross-tabulation pivot grid and subtotal aggregations.',
        healthStatus: 'ACTIVE'
      },
      {
        id: 'cons_apriori',
        label: 'Apriori Basket Mining',
        tier: 'Tier 4: Analytics & Mining',
        tierIndex: 4,
        entityType: 'CONSUMER',
        database: 'Association Rule Miner',
        description: 'Market Basket Analysis extracting frequent itemsets, Support, Confidence, and Lift.',
        healthStatus: 'ACTIVE'
      },
      {
        id: 'cons_kmeans',
        label: 'RFM K-Means Clustering',
        tier: 'Tier 4: Analytics & Mining',
        tierIndex: 4,
        entityType: 'CONSUMER',
        database: 'Unsupervised ML Cluster',
        description: 'Segments customers into 4 clusters: Champions, Loyal, At-Risk, and Inactive.',
        healthStatus: 'ACTIVE'
      },
      {
        id: 'cons_churn_model',
        label: 'Predictive Churn Engine',
        tier: 'Tier 4: Analytics & Mining',
        tierIndex: 4,
        entityType: 'CONSUMER',
        database: 'Supervised Decision Tree',
        description: 'Evaluates customer inactivity, cart friction, and review sentiment to forecast churn.',
        healthStatus: 'ACTIVE'
      },
      {
        id: 'cons_neural_rec',
        label: 'Neural Mining (NCF & GRU)',
        tier: 'Tier 4: Analytics & Mining',
        tierIndex: 4,
        entityType: 'CONSUMER',
        database: 'PyTorch Deep Learning',
        description: 'Neural Collaborative Filtering & Gated Recurrent Units for next-item predictions.',
        healthStatus: 'ACTIVE'
      }
    ];

    // Directed Edges connecting Upstream -> Downstream
    const edges = [
      // Tier 1 -> Tier 2
      { from: 'src_products', to: 'etl_prod_norm', label: 'Extract Products' },
      { from: 'src_users', to: 'etl_rfm_cust', label: 'Extract Users' },
      { from: 'src_orders', to: 'etl_rfm_cust', label: 'Order History' },
      { from: 'src_orders', to: 'etl_sales_denorm', label: 'Extract Orders' },
      { from: 'src_order_items', to: 'etl_sales_denorm', label: 'Extract Line Items' },
      { from: 'src_products', to: 'etl_sales_denorm', label: 'Product Metadata' },
      { from: 'src_interactions', to: 'etl_telemetry_agg', label: 'Event Telemetry' },
      { from: 'src_products', to: 'etl_telemetry_agg', label: 'Category Lookup' },

      // Tier 2 -> Tier 3
      { from: 'etl_time_gen', to: 'wh_dim_time', label: 'Load Dim_Time' },
      { from: 'etl_prod_norm', to: 'wh_dim_product', label: 'Load Dim_Product' },
      { from: 'etl_rfm_cust', to: 'wh_dim_customer', label: 'Load Dim_Customer' },
      { from: 'etl_sales_denorm', to: 'wh_fact_sales', label: 'Load Fact_Sales' },
      { from: 'etl_telemetry_agg', to: 'wh_fact_interaction_daily', label: 'Load Fact_Interactions' },

      // Tier 3 -> Tier 4 (Warehouse Consumers)
      { from: 'wh_fact_sales', to: 'cons_bi_dashboard', label: 'KPI Aggregations' },
      { from: 'wh_dim_time', to: 'cons_bi_dashboard', label: 'Time Drill-Down' },
      { from: 'wh_fact_sales', to: 'cons_olap_cube', label: 'CUBE Aggregations' },
      { from: 'wh_dim_product', to: 'cons_olap_cube', label: 'Hierarchy Roll-Up' },
      { from: 'wh_fact_sales', to: 'cons_apriori', label: 'Transaction Baskets' },
      { from: 'wh_dim_customer', to: 'cons_kmeans', label: 'RFM Features' },
      { from: 'wh_dim_customer', to: 'cons_churn_model', label: 'Customer State' },
      { from: 'wh_fact_interaction_daily', to: 'cons_neural_rec', label: 'Click Sequences' },
      { from: 'src_interactions', to: 'cons_neural_rec', label: 'Interaction Matrix' }
    ];

    return {
      nodes,
      edges,
      tiers: [
        'Tier 1: OLTP Sources',
        'Tier 2: ETL & Transform',
        'Tier 3: Star Schema DW',
        'Tier 4: Analytics & Mining'
      ],
      totalNodes: nodes.length,
      totalEdges: edges.length,
      generatedAt: new Date().toISOString()
    };
  }
};
