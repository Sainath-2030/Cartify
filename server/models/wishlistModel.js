import { query } from '../config/db.js';

export const WishlistModel = {
  // Retrieves user's wishlist items with joined product information
  async findByUserId(userId) {
    const result = await query(
      `SELECT
        wi.id AS wishlist_item_id,
        wi.created_at AS added_at,
        p.id AS product_id,
        p.name,
        p.slug,
        p.brand,
        p.price,
        p.discount_percentage,
        p.final_price,
        p.rating,
        p.review_count,
        p.stock_quantity,
        p.main_image,
        p.is_active,
        c.name AS category_name,
        c.slug AS category_slug
       FROM wishlist_items wi
       JOIN products p ON p.id = wi.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE wi.user_id = $1
       ORDER BY wi.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Adds a product to user's wishlist (idempotent ON CONFLICT DO NOTHING)
  async addItem({ userId, productId }) {
    const result = await query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING id, user_id, product_id, created_at`,
      [userId, productId]
    );
    return result.rows[0] || null;
  },

  // Removes a product from user's wishlist
  async removeItem({ userId, productId }) {
    const result = await query(
      `DELETE FROM wishlist_items
       WHERE user_id = $1 AND product_id = $2
       RETURNING id, product_id`,
      [userId, productId]
    );
    return result.rows[0] || null;
  },

  // Clears user's entire wishlist
  async clearWishlist(userId) {
    const result = await query(
      `DELETE FROM wishlist_items
       WHERE user_id = $1
       RETURNING id`,
      [userId]
    );
    return result.rowCount;
  },

  // Checks if a specific product is in user's wishlist
  async isWishlisted(userId, productId) {
    const result = await query(
      `SELECT id FROM wishlist_items
       WHERE user_id = $1 AND product_id = $2`,
      [userId, productId]
    );
    return (result.rowCount || 0) > 0;
  },

  // Retrieves array of wishlisted product IDs for fast O(1) lookups
  async getWishlistProductIds(userId) {
    const result = await query(
      `SELECT product_id FROM wishlist_items WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map((r) => parseInt(r.product_id, 10));
  },
};
