import { api } from './api.js';

// Fire-and-forget interaction tracking for the future recommendation
// engine. Never blocks or breaks the UI if it fails — a missed event is
// harmless, so failures are swallowed silently here.
export const interactionService = {
  record: async (payload) => {
    try {
      await api.post('/interactions', payload, { auth: true });
    } catch {
      // Intentionally ignored — tracking should never disrupt the user.
    }
  },
};
