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

  // Section 2: Association Rules (Apriori Engine)
  getAssociationRules: async (minSupport = 0.01, minConfidence = 0.2, minLift = 1.0, maxItemsetSize = 3) => {
    const res = await api.get(
      `/admin/bi/association-rules?minSupport=${minSupport}&minConfidence=${minConfidence}&minLift=${minLift}&maxItemsetSize=${maxItemsetSize}`
    );
    // API now returns { success, data: rules[], meta: {...} }
    // Preserve meta for callers that want higher-order information
    const payload = res.data;
    if (payload && Array.isArray(payload.data)) {
      payload.data.meta = payload.meta;
      return payload.data;
    }
    return payload;
  },

  // Section 3: Customer Segmentation (K-Means)
  getCustomerSegments: async () => {
    const res = await api.get('/admin/bi/customer-segments');
    return res.data;
  },

  // Section 4: Interactive Multi-Dimensional OLAP Slice & Dice
  getOlapCube: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'all')
    );
    const queryStr = new URLSearchParams(cleanParams).toString();
    const res = await api.get(`/admin/bi/olap-cube${queryStr ? `?${queryStr}` : ''}`);
    return res.data;
  },

  // Section 5: Customer Churn Classification & Predictive Forecasting
  getChurnPredictions: async (params = {}) => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '' && v !== 'all')
    );
    const queryStr = new URLSearchParams(cleanParams).toString();
    const res = await api.get(`/admin/bi/churn-predictions${queryStr ? `?${queryStr}` : ''}`);
    return res.data;
  },

  // Section 6: ETL Pipeline Monitoring, Data Lineage & Quality Auditing
  getDataQualityReport: async () => {
    const res = await api.get('/admin/bi/data-quality');
    return res.data;
  },

  runDataQualityAudit: async () => {
    const res = await api.post('/admin/bi/data-quality/audit');
    return res.data;
  },

  getDataLineage: async () => {
    const res = await api.get('/admin/bi/data-lineage');
    return res.data;
  },
};


