import { InteractionService } from '../services/interactionService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorMiddleware.js';

// POST /api/interactions
// Body: { productId?, interactionType, sessionId?, metadata? }
// Works for both guests (req.user is null via optionalAuth) and logged-in
// users. See InteractionService for how each is handled.
export const recordInteraction = asyncHandler(async (req, res) => {
  const { productId, interactionType, sessionId, metadata } = req.body || {};

  if (!interactionType) {
    throw new AppError('interactionType is required.', 422, { interactionType: 'This field is required.' });
  }

  const result = await InteractionService.record({
    user: req.user,
    productId,
    interactionType,
    sessionId,
    metadata,
  });

  res.status(201).json({ success: true, data: result });
});
