import { query } from '../config/db.js';

export const AuditModel = {
  // Inserts an audit log entry
  async record({ userId = null, action, entityType = null, entityId = null, metadata = {} }) {
    const result = await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, action, entity_type, entity_id, metadata, created_at`,
      [userId, action, entityType, entityId ? String(entityId) : null, JSON.stringify(metadata)]
    );
    return result.rows[0];
  },

  // Retrieves recent audit logs with actor info
  async findRecent(limit = 50) {
    const result = await query(
      `SELECT
         al.id,
         al.user_id,
         u.full_name AS user_name,
         u.email AS user_email,
         u.role AS user_role,
         al.action,
         al.entity_type,
         al.entity_id,
         al.metadata,
         al.created_at
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },
};
