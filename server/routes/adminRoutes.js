import { Router } from 'express';
import {
  getCatalogueHealth,
  getInteractionAnalytics,
  getTelemetryFunnel,
  getModelMetrics,
  getModelStatus,
  triggerModelEvaluation,
  getNcfRecommendations,
  getNcfAffinityMatrix,
  getCnnVisualSimilarities,
  getCnnEmbeddingMatrixSample,
  getGruRecommendations,
  getAutoencoderRecommendations,
  getAttentionFusionRecommendations,
  requestRetraining,
  getBusinessRules,
  updateBusinessRules,
  getAuditLogs,
} from '../controllers/adminController.js';
import { warehouseController } from '../controllers/warehouseController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// All admin endpoints strictly require authenticated ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

// Core Catalogue & Analytics
router.get('/catalogue/health', getCatalogueHealth);
router.get('/analytics/interactions', getInteractionAnalytics);
router.get('/analytics/funnel', getTelemetryFunnel);

// Recommendation & Data Mining Models
router.get('/models/metrics', getModelMetrics);
router.get('/models/status', getModelStatus);
router.post('/models/evaluate', triggerModelEvaluation);
router.get('/models/recommendations', getNcfRecommendations);
router.get('/models/affinity-matrix', getNcfAffinityMatrix);
router.get('/models/visual-similarity', getCnnVisualSimilarities);
router.get('/models/cnn-matrix', getCnnEmbeddingMatrixSample);
router.get('/models/gru-recommendations', getGruRecommendations);
router.get('/models/autoencoder-recommendations', getAutoencoderRecommendations);
router.get('/models/fusion-recommendations', getAttentionFusionRecommendations);
router.post('/models/retrain', requestRetraining);

// Business Rules & Audit Logs
router.get('/business-rules', getBusinessRules);
router.patch('/business-rules', updateBusinessRules);
router.get('/audit-logs', getAuditLogs);

// Section 1: Data Warehouse Layer & Star Schema (OLAP Foundation)
router.get('/bi/warehouse/overview', warehouseController.getExecutiveOverview);
router.get('/bi/warehouse/sales-trend', warehouseController.getSalesTrend);
router.get('/bi/warehouse/category-share', warehouseController.getCategoryPerformance);
router.get('/bi/warehouse/telemetry-trend', warehouseController.getTelemetryTrend);
router.get('/bi/warehouse/top-products', warehouseController.getTopProducts);
router.post('/bi/warehouse/etl-refresh', warehouseController.triggerEtlRefresh);
router.get('/bi/warehouse/etl-history', warehouseController.getEtlHistory);

// Section 2: Market Basket Analysis & Association Rules (Apriori Engine)
router.get('/bi/association-rules', warehouseController.getAssociationRules);

export default router;

