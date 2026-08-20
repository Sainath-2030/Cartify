import { query } from '../config/db.js';

// Basic structure for the future recommendation engine (Sections 4-9).
// Not exposed via any API route in Section 1 — this is scaffolding only.
export const InteractionModel = {
  async record({ userId, productId = null, interactionType, sessionId = null, metadata = {} }) {
    const result = await query(
      `INSERT INTO interactions (user_id, product_id, interaction_type, session_id, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, product_id, interaction_type, session_id, metadata, created_at`,
      [userId, productId, interactionType, sessionId, metadata]
    );
    return result.rows[0];
  },

  async findByUser(userId, limit = 50) {
    const result = await query(
      `SELECT id, product_id, interaction_type, session_id, metadata, created_at
       FROM interactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },
};
