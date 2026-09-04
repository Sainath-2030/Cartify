import { Router } from 'express';
import {
  getCatalogueHealth,
  getInteractionAnalytics,
  getModelMetrics,
  getModelStatus,
  getNcfRecommendations,
  getNcfAffinityMatrix,
  requestRetraining,
  getBusinessRules,
  updateBusinessRules,
  getAuditLogs,
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// All admin endpoints strictly require authenticated ADMIN role
router.use(requireAuth, requireRole('ADMIN'));

router.get('/catalogue/health', getCatalogueHealth);
router.get('/analytics/interactions', getInteractionAnalytics);
router.get('/models/metrics', getModelMetrics);
router.get('/models/status', getModelStatus);
router.get('/models/recommendations', getNcfRecommendations);
router.get('/models/affinity-matrix', getNcfAffinityMatrix);
router.post('/models/retrain', requestRetraining);
router.get('/business-rules', getBusinessRules);
router.patch('/business-rules', updateBusinessRules);
router.get('/audit-logs', getAuditLogs);

export default router;
