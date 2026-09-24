/**
 * Cartify Data Warehouse Service (OLAP Business Intelligence Engine)
 * 
 * Provides business logic, aggregation orchestrations, and ETL refresh triggers
 * for the Executive BI Dashboard.
 */

import { warehouseModel } from '../models/warehouseModel.js';
import { runETLPipeline } from '../scripts/etl_populate_warehouse.js';

export const warehouseService = {
  /**
   * Comprehensive BI Executive Summary combining KPIs, Trends, and Category Distribution
   */
  async getExecutiveOverview() {
    const [summary, monthlyTrend, categoryShare, priceTiers, customerTiers, etlHistory] = await Promise.all([
      warehouseModel.getWarehouseSummary(),
      warehouseModel.getSalesByTimeGrain({ timeGrain: 'month' }),
      warehouseModel.getSalesByCategory(),
      warehouseModel.getSalesByPriceTier(),
      warehouseModel.getSalesByCustomerActivityTier(),
      warehouseModel.getEtlHistory({ limit: 5 })
    ]);

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
   * Trigger Manual ETL Refresh
   */
  async triggerEtlRefresh() {
    const result = await runETLPipeline();
    return result;
  },

  /**
   * Lineage / Job Runs
   */
  async getEtlHistory({ limit = 10 }) {
    return warehouseModel.getEtlHistory({ limit });
  }
};
