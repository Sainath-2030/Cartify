import { AdminService } from '../services/adminService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateBusinessRules, validateRetrainRequest } from '../validators/adminValidators.js';
import { AppError } from '../middleware/errorMiddleware.js';

// GET /api/admin/catalogue/health
export const getCatalogueHealth = asyncHandler(async (req, res) => {
  const health = await AdminService.getCatalogueHealth();
  res.status(200).json({ success: true, data: health });
});

// GET /api/admin/analytics/interactions
export const getInteractionAnalytics = asyncHandler(async (req, res) => {
  const timeframe = req.query.timeframe || 'all';
  const analytics = await AdminService.getInteractionAnalytics({ timeframe });
  res.status(200).json({ success: true, data: analytics });
});

// GET /api/admin/models/metrics
export const getModelMetrics = asyncHandler(async (req, res) => {
  const metrics = await AdminService.getModelMetrics();
  res.status(200).json({ success: true, data: metrics });
});

// GET /api/admin/models/status
export const getModelStatus = asyncHandler(async (req, res) => {
  const status = await AdminService.getModelStatus();
  res.status(200).json({ success: true, data: status });
});

// POST /api/admin/models/retrain
export const requestRetraining = asyncHandler(async (req, res) => {
  const { valid, errors } = validateRetrainRequest(req.body);
  if (!valid) {
    throw new AppError('Invalid retrain request payload.', 422, errors);
  }

  const result = await AdminService.requestRetraining({
    user: req.user,
    trigger: req.body?.trigger || 'manual',
    parameters: req.body?.parameters || {},
  });

  res.status(202).json({
    success: true,
    message: result.message,
    data: result,
  });
});

// GET /api/admin/business-rules
export const getBusinessRules = asyncHandler(async (req, res) => {
  const rules = await AdminService.getBusinessRules();
  res.status(200).json({ success: true, data: rules });
});

// PATCH /api/admin/business-rules
export const updateBusinessRules = asyncHandler(async (req, res) => {
  const { valid, errors } = validateBusinessRules(req.body);
  if (!valid) {
    throw new AppError('Invalid business rules payload.', 422, errors);
  }

  const updated = await AdminService.updateBusinessRules({
    user: req.user,
    updates: req.body,
  });

  res.status(200).json({
    success: true,
    message: 'Business rules updated successfully.',
    data: updated,
  });
});

// GET /api/admin/models/recommendations
export const getNcfRecommendations = asyncHandler(async (req, res) => {
  const userId = parseInt(req.query.userId, 10) || 1;
  const topK = Math.min(50, Math.max(1, parseInt(req.query.topK, 10) || 5));
  const result = await AdminService.getNcfRecommendations({ userId, topK });
  res.status(200).json(result);
});

// GET /api/admin/models/affinity-matrix
export const getNcfAffinityMatrix = asyncHandler(async (req, res) => {
  const result = await AdminService.getNcfAffinityMatrix();
  res.status(200).json({ success: true, data: result });
});

// GET /api/admin/audit-logs
export const getAuditLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const logs = await AdminService.getAuditLogs(limit);
  res.status(200).json({ success: true, data: logs });
});

