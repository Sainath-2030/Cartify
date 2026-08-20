import { query } from '../config/db.js';

export const ReviewModel = {
  async findByProduct(productId, limit = 10) {
    const result = await query(
      `SELECT id, reviewer_name, rating, review_text, created_at
       FROM reviews
       WHERE product_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [productId, limit]
    );
    return result.rows;
  },

  // Rating breakdown, e.g. { 5: 120, 4: 40, 3: 10, 2: 2, 1: 1 } — used to
  // render the star distribution bars on the product detail page.
  async ratingBreakdown(productId) {
    const result = await query(
      `SELECT rating, COUNT(*) AS count
       FROM reviews
       WHERE product_id = $1
       GROUP BY rating`,
      [productId]
    );
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const row of result.rows) {
      breakdown[row.rating] = parseInt(row.count, 10);
    }
    return breakdown;
  },
};
