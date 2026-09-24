/**
 * Cartify Data Warehouse & OLAP Controller
 * 
 * Exposes REST API endpoints for the Business Intelligence (BI) Dashboard
 * and Star Schema OLAP analytical queries.
 */

import { warehouseService } from '../services/warehouseService.js';

export const warehouseController = {
  /**
   * GET /api/admin/bi/warehouse/overview
   */
  async getExecutiveOverview(req, res, next) {
    try {
      const data = await warehouseService.getExecutiveOverview();
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/bi/warehouse/sales-trend
   * Query params: timeGrain ('day'|'week'|'month'|'quarter'|'year'), year, quarter, categoryId
   */
  async getSalesTrend(req, res, next) {
    try {
      const { timeGrain, year, quarter, categoryId } = req.query;
      const data = await warehouseService.getSalesByTimeGrain({
        timeGrain: timeGrain || 'month',
        year,
        quarter,
        categoryId
      });
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/bi/warehouse/category-share
   */
  async getCategoryPerformance(req, res, next) {
    try {
      const { year, quarter, month } = req.query;
      const data = await warehouseService.getCategoryPerformance({ year, quarter, month });
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/bi/warehouse/telemetry-trend
   */
  async getTelemetryTrend(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 30;
      const data = await warehouseService.getTelemetryDailyTrend({ limit });
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/bi/warehouse/top-products
   */
  async getTopProducts(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const { categoryId } = req.query;
      const data = await warehouseService.getTopSellingProducts({ limit, categoryId });
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/admin/bi/warehouse/etl-refresh
   */
  async triggerEtlRefresh(req, res, next) {
    try {
      const result = await warehouseService.triggerEtlRefresh();
      res.status(200).json({
        success: true,
        message: 'Data Warehouse ETL batch refresh completed successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/admin/bi/warehouse/etl-history
   */
  async getEtlHistory(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const data = await warehouseService.getEtlHistory({ limit });
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
