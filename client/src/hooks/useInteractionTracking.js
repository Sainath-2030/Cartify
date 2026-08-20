import { useCallback } from 'react';
import { useAuth } from './useAuth.js';
import { interactionService } from '../services/interactionService.js';
import { getSessionId } from '../utils/session.js';

// Central place to record product-discovery events for the future
// recommendation engine. Only persists to the database for logged-in
// users (see server InteractionService); for guests this currently
// no-ops server-side but still keeps the call site consistent so wiring
// up guest analytics later is a one-line change.
export function useInteractionTracking() {
  const { isAuthenticated } = useAuth();

  const track = useCallback((interactionType, { productId, metadata } = {}) => {
    interactionService.record({
      interactionType,
      productId,
      sessionId: getSessionId(),
      metadata: metadata || {},
    });
  }, [isAuthenticated]);

  return { track };
}
