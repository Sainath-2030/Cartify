import { query } from '../config/db.js';

// Columns that are safe to ever return to the client.
// password_hash is intentionally excluded everywhere below.
const PUBLIC_COLUMNS = `
  id, email, full_name, role, avatar_url, created_at, updated_at
`;

export const UserModel = {
  async create({ fullName, email, passwordHash, role = 'USER', avatarUrl = null }) {
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${PUBLIC_COLUMNS}`,
      [fullName, email, passwordHash, role, avatarUrl]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
    return result.rows[0] || null;
  },

  async updateById(id, fields) {
    // Build a dynamic SET clause from only the fields provided.
    const allowed = ['full_name', 'mobile', 'address', 'city', 'state', 'postal_code', 'date_of_birth', 'avatar_url'];
    const setParts = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        setParts.push(`${key} = $${idx}`);
        values.push(fields[key]);
        idx += 1;
      }
    }

    if (setParts.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE users SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING ${PUBLIC_COLUMNS}`,
      values
    );
    return result.rows[0] || null;
  },
};
