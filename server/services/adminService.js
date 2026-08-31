import { AdminModel } from '../models/adminModel.js';
import { ConfigModel } from '../models/configModel.js';
import { AuditModel } from '../models/auditModel.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const AdminService = {
  // Returns live catalogue health metrics
  async getCatalogueHealth() {
    return AdminModel.getCatalogueHealth();
  },

  // Returns live interaction analytics from PostgreSQL
  async getInteractionAnalytics({ timeframe = 'all' }) {
    return AdminModel.getInteractionAnalytics(timeframe);
  },

  // Recommendation metrics contract (Returns explicit NOT_AVAILABLE state without fake percentages)
  async getModelMetrics() {
    return {
      status: 'NOT_AVAILABLE',
      message: 'Model evaluation has not been run yet. Future ML integration point for Precision@K, Recall@K, NDCG@K, Hit Ratio (Scheduled for Phase 5).',
      evaluation: null,
      supportedMetrics: ['Precision@5', 'Precision@10', 'Recall@10', 'NDCG@10', 'HitRatio@10', 'DiversityScore'],
    };
  },

  // Model status contract (Returns explicit uninitialized state without pretending ML is active)
  async getModelStatus() {
    return {
      status: 'NOT_IMPLEMENTED',
      message: 'Recommendation training pipeline is not initialized. Multi-model fusion architecture (NCF + CNN + GRU + Autoencoder + Attention Fusion) will be connected in Phase 5.',
      models: [
        {
          name: 'NCF (Neural Collaborative Filtering)',
          type: 'Collaborative Filtering',
          version: 'v0.0.0-uninitialized',
          status: 'NOT_TRAINED',
          lastTrainedAt: null,
        },
        {
          name: 'CNN (Image Feature Extractor)',
          type: 'Content Visual Embeddings',
          version: 'v0.0.0-uninitialized',
          status: 'NOT_TRAINED',
          lastTrainedAt: null,
        },
        {
          name: 'GRU (Sequential Session RNN)',
          type: 'Session-Based Recommender',
          version: 'v0.0.0-uninitialized',
          status: 'NOT_TRAINED',
          lastTrainedAt: null,
        },
        {
          name: 'Autoencoder (Denoising Item Latent)',
          type: 'Dimensionality Reduction',
          version: 'v0.0.0-uninitialized',
          status: 'NOT_TRAINED',
          lastTrainedAt: null,
        },
        {
          name: 'Attention Fusion Layer',
          type: 'Multi-Modal Hybrid Aggregator',
          version: 'v0.0.0-uninitialized',
          status: 'NOT_TRAINED',
          lastTrainedAt: null,
        },
      ],
    };
  },

  // Retraining request contract (Does not block server with fake training)
  async requestRetraining({ user, trigger = 'manual', parameters = {} }) {
    const requestId = `retrain-req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    await AuditModel.record({
      userId: user.id,
      action: 'MODEL_RETRAIN_REQUEST',
      entityType: 'model_pipeline',
      entityId: requestId,
      metadata: { trigger, parameters },
    });

    return {
      status: 'QUEUED',
      requestId,
      message: 'Retraining job request registered. Training engine will execute via background workers upon Phase 5 ML pipeline deployment.',
      trigger,
      requestedBy: user.email,
      queuedAt: new Date().toISOString(),
    };
  },

  // Retrieves business rules configuration
  async getBusinessRules() {
    const rules = await ConfigModel.get('recommendation_business_rules');
    return (
      rules || {
        diversityBoost: 0.15,
        minRatingThreshold: 3.5,
        maxDiscountHighlight: 0.5,
        interactionWeights: {
          VIEW: 1.0,
          SEARCH: 1.5,
          WISHLIST_ADD: 3.0,
          CART_ADD: 4.0,
          RATING: 3.5,
          REVIEW: 4.0,
          PURCHASE: 5.0,
        },
      }
    );
  },

  // Updates business rules configuration
  async updateBusinessRules({ user, updates }) {
    const current = await this.getBusinessRules();
    const merged = {
      ...current,
      ...updates,
    };

    await ConfigModel.set(
      'recommendation_business_rules',
      merged,
      'Global recommendation engine scoring weights, interaction values, and diversity factors.'
    );

    await AuditModel.record({
      userId: user.id,
      action: 'BUSINESS_RULES_UPDATE',
      entityType: 'system_config',
      entityId: 'recommendation_business_rules',
      metadata: { previous: current, updated: merged },
    });

    return merged;
  },

  // Retrieves recent audit logs
  async getAuditLogs(limit = 50) {
    const rows = await AuditModel.findRecent(limit);
    return rows.map((r) => ({
      id: parseInt(r.id, 10),
      userId: r.user_id ? parseInt(r.user_id, 10) : null,
      userName: r.user_name,
      userEmail: r.user_email,
      userRole: r.user_role,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
      createdAt: r.created_at,
    }));
  },
};
