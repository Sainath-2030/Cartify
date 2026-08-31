import { InteractionModel } from '../models/interactionModel.js';
import { ProductModel } from '../models/productModel.js';
import { AppError } from '../middleware/errorMiddleware.js';

const VALID_ALL_TYPES = [
  'VIEW',
  'SEARCH',
  'WISHLIST_ADD',
  'WISHLIST_REMOVE',
  'CART_ADD',
  'CART_REMOVE',
  'PURCHASE',
  'RATING',
  'REVIEW',
];

export const InteractionService = {
  // Records client-reported telemetry (VIEW, SEARCH)
  async recordClientInteraction({ user, productId, interactionType, sessionId, metadata = {} }) {
    if (!['VIEW', 'SEARCH'].includes(interactionType)) {
      throw new AppError('Invalid client interaction type.', 422);
    }

    let verifiedProductId = null;
    if (productId) {
      const product = await ProductModel.findById(productId);
      if (!product || !product.is_active) {
        throw new AppError('Product not found or is unavailable.', 404);
      }
      verifiedProductId = parseInt(product.id, 10);
    }

    const userId = user ? parseInt(user.id, 10) : null;
    const finalSessionId = sessionId || (userId ? `user-session-${userId}` : `guest-${Date.now()}`);

    const row = await InteractionModel.record({
      userId,
      productId: verifiedProductId,
      interactionType,
      sessionId: finalSessionId,
      metadata,
    });

    return {
      recorded: true,
      id: parseInt(row.id, 10),
      userId: row.user_id ? parseInt(row.user_id, 10) : null,
      productId: row.product_id ? parseInt(row.product_id, 10) : null,
      interactionType: row.interaction_type,
      sessionId: row.session_id,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: row.created_at,
    };
  },

  // Authoritative server-side event recorder (called by Cart, Wishlist, Reviews, Orders services)
  async recordTrusted({ userId = null, productId = null, interactionType, sessionId = null, metadata = {} }) {
    if (!VALID_ALL_TYPES.includes(interactionType)) {
      return null;
    }

    try {
      const row = await InteractionModel.record({
        userId: userId ? parseInt(userId, 10) : null,
        productId: productId ? parseInt(productId, 10) : null,
        interactionType,
        sessionId: sessionId || (userId ? `user-${userId}` : `system-${Date.now()}`),
        metadata,
      });
      return row;
    } catch (err) {
      // Non-blocking telemetry error logging
      console.warn('Telemetry event record error (non-fatal):', err.message);
      return null;
    }
  },

  // Telemetry counts for diagnostic monitoring
  async getCountsByType() {
    return InteractionModel.countByType();
  },
};
