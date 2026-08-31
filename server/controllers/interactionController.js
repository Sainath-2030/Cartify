import { InteractionService } from '../services/interactionService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateClientInteraction } from '../validators/interactionValidators.js';
import { AppError } from '../middleware/errorMiddleware.js';

// POST /api/interactions
// Body: { interactionType: 'VIEW' | 'SEARCH', productId?: number, sessionId?: string, metadata?: object }
export const recordInteraction = asyncHandler(async (req, res) => {
  const { valid, errors, data } = validateClientInteraction(req.body);
  if (!valid) {
    throw new AppError('Invalid interaction payload.', 422, errors);
  }

  const result = await InteractionService.recordClientInteraction({
    user: req.user,
    productId: data.productId,
    interactionType: data.interactionType,
    sessionId: data.sessionId,
    metadata: data.metadata,
  });

  res.status(201).json({
    success: true,
    message: 'Interaction recorded.',
    data: result,
  });
});
