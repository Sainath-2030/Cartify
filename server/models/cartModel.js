import { query } from '../config/db.js';

export const CartModel = {
  // Retrieves user's cart items with joined product information
  async findByUserId(userId) {
    const result = await query(
      `SELECT
        ci.id AS cart_item_id,
        ci.quantity,
        ci.created_at AS added_at,
        ci.updated_at,
        p.id AS product_id,
        p.name,
        p.slug,
        p.brand,
        p.price,
        p.discount_percentage,
        p.final_price,
        p.stock_quantity,
        p.main_image,
        p.is_active,
        c.name AS category_name,
        c.slug AS category_slug
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ci.user_id = $1
       ORDER BY ci.updated_at DESC, ci.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Inserts a new cart item or increments quantity if it already exists
  async addItem({ userId, productId, quantity }) {
    const result = await query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity,
                     updated_at = NOW()
       RETURNING id, user_id, product_id, quantity, created_at, updated_at`,
      [userId, productId, quantity]
    );
    return result.rows[0];
  },

  // Sets exact quantity for a specific product in user's cart
  async updateQuantity({ userId, productId, quantity }) {
    const result = await query(
      `UPDATE cart_items
       SET quantity = $3,
           updated_at = NOW()
       WHERE user_id = $1 AND product_id = $2
       RETURNING id, user_id, product_id, quantity, created_at, updated_at`,
      [userId, productId, quantity]
    );
    return result.rows[0] || null;
  },

  // Removes a single product from user's cart
  async removeItem({ userId, productId }) {
    const result = await query(
      `DELETE FROM cart_items
       WHERE user_id = $1 AND product_id = $2
       RETURNING id, product_id`,
      [userId, productId]
    );
    return result.rows[0] || null;
  },

  // Clears all items from user's cart
  async clearCart(userId) {
    const result = await query(
      `DELETE FROM cart_items
       WHERE user_id = $1
       RETURNING id`,
      [userId]
    );
    return result.rowCount;
  },

  // Returns total item count across all rows for badge
  async countTotalItems(userId) {
    const result = await query(
      `SELECT COALESCE(SUM(quantity), 0) AS total_items
       FROM cart_items
       WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].total_items, 10);
  },

  // Find a specific item in the user's cart
  async findItem(userId, productId) {
    const result = await query(
      `SELECT id, user_id, product_id, quantity
       FROM cart_items
       WHERE user_id = $1 AND product_id = $2`,
      [userId, productId]
    );
    return result.rows[0] || null;
  },
};
