import { api } from './api.js';

export const adminService = {
  // Model management & evaluation
  getModelStatus: async () => {
    const res = await api.get('/admin/models/status');
    return res.data;
  },

  getModelMetrics: async () => {
    const res = await api.get('/admin/models/metrics');
    return res.data;
  },

  getNcfRecommendations: async (userId = 1, topK = 5) => {
    return api.get(`/admin/models/recommendations?userId=${userId}&topK=${topK}`);
  },

  getNcfAffinityMatrix: async () => {
    const res = await api.get('/admin/models/affinity-matrix');
    return res.data;
  },

  getGruRecommendations: async (userId = 1, topK = 5) => {
    return api.get(`/admin/models/gru-recommendations?userId=${userId}&topK=${topK}`);
  },

  getAutoencoderRecommendations: async (userId = 1, topK = 5) => {
    return api.get(`/admin/models/autoencoder-recommendations?userId=${userId}&topK=${topK}`);
  },

  getAttentionFusionRecommendations: async (userId = 1, topK = 5, sessionId = null) => {
    let url = `/admin/models/fusion-recommendations?userId=${userId}&topK=${topK}`;
    if (sessionId) url += `&sessionId=${encodeURIComponent(sessionId)}`;
    return api.get(url);
  },


  getCnnVisualSimilarities: async (productId = 3129, topK = 6, categoryId = null, allCategories = false) => {
    let url = `/admin/models/visual-similarity?productId=${productId}&topK=${topK}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    if (allCategories) url += `&allCategories=true`;
    const res = await api.get(url);
    return res.data;
  },

  getCnnEmbeddingMatrixSample: async (limit = 6) => {
    const res = await api.get(`/admin/models/cnn-matrix?limit=${limit}`);
    return res.data;
  },

  requestRetraining: async (payload = {}) => {
    return api.post('/admin/models/retrain', payload);
  },

  // Operational analytics & catalogue
  getCatalogueHealth: async () => {
    const res = await api.get('/admin/catalogue/health');
    return res.data;
  },

  getInteractionAnalytics: async (timeframe = 'all') => {
    const res = await api.get(`/admin/analytics/interactions?timeframe=${timeframe}`);
    return res.data;
  },

  getTelemetryFunnel: async (timeframe = 'all') => {
    const res = await api.get(`/admin/analytics/funnel?timeframe=${timeframe}`);
    return res.data;
  },

  triggerModelEvaluation: async () => {
    const res = await api.post('/admin/models/evaluate');
    return res.data;
  },

  getBusinessRules: async () => {
    const res = await api.get('/admin/business-rules');
    return res.data;
  },

  updateBusinessRules: async (rules) => {
    const res = await api.patch('/admin/business-rules', rules);
    return res.data;
  },

  getAuditLogs: async (limit = 50) => {
    const res = await api.get(`/admin/audit-logs?limit=${limit}`);
    return res.data;
  },

  // Section 1: Data Warehouse & BI Star Schema
  getWarehouseOverview: async () => {
    const res = await api.get('/admin/bi/warehouse/overview');
    return res.data;
  },

  getWarehouseSalesTrend: async (timeGrain = 'month', params = {}) => {
    const queryStr = new URLSearchParams({ timeGrain, ...params }).toString();
    const res = await api.get(`/admin/bi/warehouse/sales-trend?${queryStr}`);
    return res.data;
  },

  getWarehouseCategoryShare: async (params = {}) => {
    const queryStr = new URLSearchParams(params).toString();
    const res = await api.get(`/admin/bi/warehouse/category-share?${queryStr}`);
    return res.data;
  },

  getWarehouseTopProducts: async (limit = 10, categoryId = null) => {
    let url = `/admin/bi/warehouse/top-products?limit=${limit}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    const res = await api.get(url);
    return res.data;
  },

  triggerWarehouseEtl: async () => {
    const res = await api.post('/admin/bi/warehouse/etl-refresh');
    return res.data;
  },

  getWarehouseEtlHistory: async (limit = 10) => {
    const res = await api.get(`/admin/bi/warehouse/etl-history?limit=${limit}`);
    return res.data;
  },

  // Section 2: Association Rules
  getAssociationRules: async (minSupport = 0.01, minConfidence = 0.2, minLift = 1.0) => {
    const res = await api.get(`/admin/bi/association-rules?minSupport=${minSupport}&minConfidence=${minConfidence}&minLift=${minLift}`);
    return res.data;
  },
};

