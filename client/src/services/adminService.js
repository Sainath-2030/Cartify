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
};
