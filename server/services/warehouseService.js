/**
 * Cartify Data Warehouse Service (OLAP Business Intelligence Engine)
 * 
 * Provides business logic, aggregation orchestrations, and ETL refresh triggers
 * for the Executive BI Dashboard.
 */

import { warehouseModel } from '../models/warehouseModel.js';
import { settleLimit } from '../config/db.js';
import { runETLPipeline } from '../scripts/etl_populate_warehouse.js';
import { dataQualityService } from './mining/dataQualityService.js';

let activeEtlPromise = null;

export const warehouseService = {
  /**
   * Comprehensive BI Executive Summary combining KPIs, Trends, and Category Distribution
   */
  async getExecutiveOverview() {
    let summary, monthlyTrend, categoryShare, priceTiers, customerTiers, etlHistory;

    // Six warehouse aggregations back the Star Schema panel. Issuing all six at
    // once (plus the OLAP cube and governance calls the dashboard fires in
    // parallel) exhausted the managed Postgres client cap, so run them two at
    // a time. `runOverviewQueries` also re-runs after self-healing below.
    const runOverviewQueries = () => settleLimit([
      () => warehouseModel.getWarehouseSummary(),
      () => warehouseModel.getSalesByTimeGrain({ timeGrain: 'month' }),
      () => warehouseModel.getSalesByCategory(),
      () => warehouseModel.getSalesByPriceTier(),
      () => warehouseModel.getSalesByCustomerActivityTier(),
      () => warehouseModel.getEtlHistory({ limit: 5 })
    ], 2);

    try {
      [summary, monthlyTrend, categoryShare, priceTiers, customerTiers, etlHistory] = await runOverviewQueries();
    } catch (err) {
      // Match only SQLSTATE 42P01 (undefined_table)
      if (err.code === '42P01') {
        console.log('[Warehouse] Star schema tables missing in database (42P01), restoring via triggerEtlRefresh without synthetic seeding...');
        await this.triggerEtlRefresh({ seedTransactions: false });
        [summary, monthlyTrend, categoryShare, priceTiers, customerTiers, etlHistory] = await runOverviewQueries();
      } else {
        throw err;
      }
    }

    const latestEtl = etlHistory[0] || null;

    return {
      kpis: {
        grossRevenue: parseFloat(summary.total_gross_revenue) || 0,
        totalDiscounts: parseFloat(summary.total_discounts) || 0,
        netRevenue: parseFloat(summary.total_net_revenue) || 0,
        totalUnitsSold: parseInt(summary.total_units_sold, 10) || 0,
        totalOrders: parseInt(summary.total_orders_count, 10) || 0,
        activeCustomers: parseInt(summary.active_customers_count, 10) || 0,
        productsTransacted: parseInt(summary.products_transacted_count, 10) || 0,
        avgItemRevenue: parseFloat(summary.avg_item_revenue) || 0,
        averageOrderValue: parseFloat(summary.average_order_value) || 0
      },
      monthlyTrend: monthlyTrend.map(row => ({
        periodKey: row.period_key,
        label: row.period_label,
        netRevenue: parseFloat(row.net_revenue) || 0,
        grossRevenue: parseFloat(row.gross_revenue) || 0,
        orderCount: parseInt(row.order_count, 10) || 0,
        unitsSold: parseInt(row.units_sold, 10) || 0
      })),
      categoryShare: categoryShare.map(row => ({
        categoryId: row.category_id,
        categoryName: row.category_name,
        netRevenue: parseFloat(row.net_revenue) || 0,
        revenueSharePct: parseFloat(row.revenue_share_pct) || 0,
        unitsSold: parseInt(row.units_sold, 10) || 0,
        orderCount: parseInt(row.order_count, 10) || 0,
        avgUnitPrice: parseFloat(row.avg_unit_price) || 0
      })),
      priceTiers: priceTiers.map(row => ({
        priceTier: row.price_tier,
        productCount: parseInt(row.product_count, 10) || 0,
        unitsSold: parseInt(row.units_sold, 10) || 0,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        avgUnitPrice: parseFloat(row.avg_unit_price) || 0
      })),
      customerTiers: customerTiers.map(row => ({
        activityTier: row.activity_tier,
        customerCount: parseInt(row.customer_count, 10) || 0,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        unitsPurchased: parseInt(row.units_purchased, 10) || 0,
        revenuePerCustomer: parseFloat(row.revenue_per_customer) || 0
      })),
      etlHealth: {
        lastSync: latestEtl?.started_at || null,
        status: latestEtl?.status || 'UNKNOWN',
        executionTimeMs: latestEtl?.execution_time_ms || 0,
        recordsLoaded: latestEtl?.records_loaded || 0
      }
    };
  },

  /**
   * Slice & Dice Time-Series Aggregations
   */
  async getSalesByTimeGrain({ timeGrain, year, quarter, categoryId }) {
    const rawData = await warehouseModel.getSalesByTimeGrain({ timeGrain, year, quarter, categoryId });
    return rawData.map(row => ({
      periodKey: row.period_key,
      label: row.period_label,
      netRevenue: parseFloat(row.net_revenue) || 0,
      grossRevenue: parseFloat(row.gross_revenue) || 0,
      discounts: parseFloat(row.total_discounts) || 0,
      unitsSold: parseInt(row.units_sold, 10) || 0,
      orderCount: parseInt(row.order_count, 10) || 0,
      uniqueBuyers: parseInt(row.unique_buyers, 10) || 0
    }));
  },

  /**
   * Category Slicing
   */
  async getCategoryPerformance({ year, quarter, month }) {
    const rawData = await warehouseModel.getSalesByCategory({ year, quarter, month });
    return rawData.map(row => ({
      categoryId: row.category_id,
      categoryName: row.category_name,
      netRevenue: parseFloat(row.net_revenue) || 0,
      revenueSharePct: parseFloat(row.revenue_share_pct) || 0,
      unitsSold: parseInt(row.units_sold, 10) || 0,
      orderCount: parseInt(row.order_count, 10) || 0,
      distinctProductsSold: parseInt(row.distinct_products_sold, 10) || 0,
      avgUnitPrice: parseFloat(row.avg_unit_price) || 0
    }));
  },

  /**
   * Daily Telemetry from Fact_Interaction_Daily
   */
  async getTelemetryDailyTrend({ limit = 30 }) {
    const rawData = await warehouseModel.getTelemetryDailyTrend({ limit });
    return rawData.map(row => ({
      date: row.date_label,
      views: parseInt(row.views, 10) || 0,
      searches: parseInt(row.searches, 10) || 0,
      carts: parseInt(row.carts, 10) || 0,
      wishlists: parseInt(row.wishlists, 10) || 0,
      purchases: parseInt(row.purchases, 10) || 0,
      totalInteractions: parseInt(row.total_interactions, 10) || 0,
      uniqueUsers: parseInt(row.unique_users, 10) || 0
    }));
  },

  /**
   * Top Selling Products
   */
  async getTopSellingProducts({ limit = 10, categoryId }) {
    const rawData = await warehouseModel.getTopSellingProducts({ limit, categoryId });
    return rawData.map(row => ({
      productId: row.product_id,
      title: row.title,
      brand: row.brand,
      categoryName: row.category_name,
      priceTier: row.price_tier,
      unitsSold: parseInt(row.units_sold, 10) || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      ordersCount: parseInt(row.orders_count, 10) || 0
    }));
  },

  /**
   * Trigger Manual ETL Refresh (prevent concurrent overlapping runs)
   */
  async triggerEtlRefresh(options = {}) {
    if (activeEtlPromise) {
      return activeEtlPromise;
    }

    activeEtlPromise = (async () => {
      try {
        return await runETLPipeline(options);
      } finally {
        activeEtlPromise = null;
      }
    })();

    return activeEtlPromise;
  },

  /**
   * Lineage / Job Runs
   */
  async getEtlHistory({ limit = 10 }) {
    return warehouseModel.getEtlHistory({ limit });
  },

  /**
   * SECTION 4: Interactive Multi-Dimensional OLAP Slice & Dice
   * Returns CUBE / ROLLUP aggregated cells, filtered time-series trend, pivot matrix,
   * and available dimensions for dynamic UI exploration.
   */
  async getOlapCube({
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
    const [metadata, cubeResult] = await Promise.all([
      warehouseModel.getOlapMetadata(),
      warehouseModel.getOlapCubeData({
        timeGrain,
        categoryId,
        priceTier,
        activityTier,
        year,
        quarter,
        month,
        cubeMode,
        metric
      })
    ]);

    const summary = cubeResult.summary || {};
    const totalNetRevenue = parseFloat(summary.total_net_revenue) || 0;
    const totalOrders = parseInt(summary.total_orders_count, 10) || 0;

    return {
      metadata,
      activeFilters: {
        timeGrain: timeGrain || 'month',
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
        priceTier: priceTier || null,
        activityTier: activityTier || null,
        year: year ? parseInt(year, 10) : null,
        quarter: quarter ? parseInt(quarter, 10) : null,
        month: month ? parseInt(month, 10) : null,
        cubeMode: cubeMode || 'cube',
        metric: metric || 'net_revenue'
      },
      summary: {
        grossRevenue: parseFloat(summary.total_gross_revenue) || 0,
        totalDiscounts: parseFloat(summary.total_discounts) || 0,
        netRevenue: totalNetRevenue,
        unitsSold: parseInt(summary.total_units_sold, 10) || 0,
        orderCount: totalOrders,
        totalOrders: totalOrders,
        activeCustomers: parseInt(summary.active_customers_count, 10) || 0,
        productsTransacted: parseInt(summary.products_transacted_count, 10) || 0,
        averageOrderValue: parseFloat(summary.average_order_value) || 0
      },
      timeSeries: (cubeResult.timeSeries || []).map(row => ({
        periodKey: row.period_key,
        label: row.period_label,
        netRevenue: parseFloat(row.net_revenue) || 0,
        grossRevenue: parseFloat(row.gross_revenue) || 0,
        unitsSold: parseInt(row.units_sold, 10) || 0,
        orderCount: parseInt(row.order_count, 10) || 0
      })),
      cubeCells: (cubeResult.cubeCells || []).map(row => {
        const isDim1Subtotal = parseInt(row.is_dim1_subtotal, 10) === 1;
        const isDim2Subtotal = parseInt(row.is_dim2_subtotal, 10) === 1;
        const isDim3Subtotal = parseInt(row.is_dim3_subtotal, 10) === 1;
        const isGrandTotal = (isDim1Subtotal && isDim2Subtotal && (!row.dim_3 || isDim3Subtotal));

        return {
          dim1: row.dim_1,
          dim2: row.dim_2,
          dim3: row.dim_3,
          cubeType: row.cube_type,
          isDim1Subtotal,
          isDim2Subtotal,
          isDim3Subtotal,
          isSubtotal: (isDim1Subtotal || isDim2Subtotal || isDim3Subtotal) && !isGrandTotal,
          isGrandTotal,
          aggregationLevel: parseInt(row.aggregation_level, 10) || 0,
          netRevenue: parseFloat(row.net_revenue) || 0,
          grossRevenue: parseFloat(row.gross_revenue) || 0,
          unitsSold: parseInt(row.units_sold, 10) || 0,
          orderCount: parseInt(row.order_count, 10) || 0,
          customerCount: parseInt(row.customer_count, 10) || 0
        };
      }),
      pivotData: (cubeResult.pivotData || []).map(row => ({
        rowDim: row.row_dim || row.category_name,
        colDim: row.col_dim || row.price_tier,
        categoryName: row.category_name,
        priceTier: row.price_tier,
        netRevenue: parseFloat(row.net_revenue) || 0,
        unitsSold: parseInt(row.units_sold, 10) || 0,
        orderCount: parseInt(row.order_count, 10) || 0
      }))
    };
  },

  /**
   * SECTION 6: Data Quality Audit Report & Historical Trend
   */
  async getDataQualityReport() {
    return dataQualityService.getDataQualityReport();
  },

  /**
   * SECTION 6: Trigger Fresh Automated Data Quality Audit
   */
  async runDataQualityAudit() {
    return dataQualityService.runQualityAudit();
  },

  /**
   * SECTION 6: 4-Tier Architectural Data Lineage DAG & Live Node Counts
   */
  async getDataLineage() {
    return dataQualityService.getDataLineageGraph();
  }
};

