import { query } from '../config/db.js';

export const ConfigModel = {
  // Retrieves a configuration value by key
  async get(key) {
    const result = await query(
      `SELECT key, value, description, updated_at
       FROM system_configs
       WHERE key = $1`,
      [key]
    );
    if (!result.rows[0]) return null;
    return typeof result.rows[0].value === 'string'
      ? JSON.parse(result.rows[0].value)
      : result.rows[0].value;
  },

  // Sets or updates a configuration value
  async set(key, value, description = null) {
    const result = await query(
      `INSERT INTO system_configs (key, value, description, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           description = COALESCE(EXCLUDED.description, system_configs.description),
           updated_at = NOW()
       RETURNING key, value, description, updated_at`,
      [key, JSON.stringify(value), description]
    );
    return typeof result.rows[0].value === 'string'
      ? JSON.parse(result.rows[0].value)
      : result.rows[0].value;
  },
};
