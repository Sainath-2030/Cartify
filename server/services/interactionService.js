import { InteractionModel } from '../models/interactionModel.js';
import { AppError } from '../middleware/errorMiddleware.js';

const VALID_TYPES = ['product_view', 'product_click', 'search', 'category_view'];

// Foundation for the future recommendation engine (Sections 4-9). This
// only records clean interaction rows — no scoring, ranking, or model
// logic happens here.
export const InteractionService = {
  async record({ user, productId, interactionType, sessionId, metadata }) {
    if (!VALID_TYPES.includes(interactionType)) {
      throw new AppError('Invalid interaction type.', 422);
    }

    // Guests are tracked only via session_id, never against a user_id,
    // so anonymous and authenticated activity stay clearly separated.
    if (!user && !sessionId) {
      throw new AppError('A sessionId is required for unauthenticated interaction tracking.', 422);
    }

    if (!user) {
      // No user_id column write for guests — just log via session_id.
      // (interactions.user_id is NOT NULL in Section 1's schema, so
      // guest events are intentionally not persisted to that table in
      // Section 2. This keeps guest analytics separate until a future
      // section introduces anonymous-safe storage.)
      return { recorded: false, reason: 'guest_session_not_persisted' };
    }

    const row = await InteractionModel.record({
      userId: user.id,
      productId: productId || null,
      interactionType,
      sessionId: sessionId || null,
      metadata: metadata || {},
    });

    return { recorded: true, interaction: row };
  },
};
