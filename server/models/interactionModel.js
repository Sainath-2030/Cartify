import { query } from '../config/db.js';

export const InteractionModel = {
  // Inserts a new telemetry event into interactions table
  async record({ userId = null, productId = null, interactionType, sessionId = null, metadata = {} }) {
    const result = await query(
      `INSERT INTO interactions (user_id, product_id, interaction_type, session_id, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, product_id, interaction_type, session_id, metadata, created_at`,
      [userId, productId, interactionType, sessionId, JSON.stringify(metadata)]
    );
    return result.rows[0];
  },

  // Retrieves interactions for a user
  async findByUser(userId, limit = 50) {
    const result = await query(
      `SELECT id, user_id, product_id, interaction_type, session_id, metadata, created_at
       FROM interactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  // Returns counts grouped by interaction_type
  async countByType() {
    const result = await query(
      `SELECT interaction_type, COUNT(*) AS count
       FROM interactions
       GROUP BY interaction_type
       ORDER BY count DESC`
    );
    return result.rows;
  },
};
