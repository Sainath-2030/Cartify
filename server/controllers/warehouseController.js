/**
 * Cartify Data Warehouse & OLAP Controller
 * 
 * Exposes REST API endpoints for the Business Intelligence (BI) Dashboard
 * and Star Schema OLAP analytical queries.
 */

import { warehouseService } from '../services/warehouseService.js';
import { aprioriService } from '../services/mining/aprioriService.js';
import { kmeansService } from '../services/mining/kmeansService.js';
import { churnService } from '../services/mining/churnService.js';

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
   * GET /api/admin/bi/association-rules
   */
  async getAssociationRules(req, res, next) {
    try {
      const minSupport = parseFloat(req.query.minSupport) || 0.01;
      const minConfidence = parseFloat(req.query.minConfidence) || 0.2;
      const minLift = parseFloat(req.query.minLift) || 1.0;
      
      const data = await aprioriService.mineAssociationRules({
        minSupport,
        minConfidence,
        minLift
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
   * GET /api/admin/bi/customer-segments
   */
  async getCustomerSegments(req, res, next) {
    try {
      const data = await kmeansService.clusterCustomers();
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
  },

  /**
   * GET /api/admin/bi/olap-cube
   * Section 4: Multi-dimensional CUBE, ROLLUP, Slicing & Dicing
   */
  async getOlapCube(req, res, next) {
    try {
      const {
        timeGrain,
        categoryId,
        priceTier,
        activityTier,
        year,
        quarter,
        month,
        cubeMode,
        metric
      } = req.query;

      const data = await warehouseService.getOlapCube({
        timeGrain,
        categoryId,
        priceTier,
        activityTier,
        year,
        quarter,
        month,
        cubeMode,
        metric
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
   * GET /api/admin/bi/churn-predictions
   * Section 5: Customer Churn Classification & Predictive Forecasting
   */
  async getChurnPredictions(req, res, next) {
    try {
      const { riskLevel, limit, sortBy } = req.query;
      const data = await churnService.predictChurn({
        riskLevelFilter: riskLevel || 'all',
        limit: parseInt(limit, 10) || 50,
        sortBy: sortBy || 'churnProbability'
      });

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
};

