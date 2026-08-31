import { query } from '../config/db.js';

export const ReviewModel = {
  // Returns reviews for a product with pagination and author info
  async findByProduct(productId, limit = 20) {
    const result = await query(
      `SELECT id, product_id, user_id, reviewer_name, rating, review_text, created_at
       FROM reviews
       WHERE product_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [productId, limit]
    );
    return result.rows;
  },

  // Returns paginated reviews
  async findByProductPaginated(productId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT id, product_id, user_id, reviewer_name, rating, review_text, created_at
       FROM reviews
       WHERE product_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );
    return result.rows;
  },

  // Counts total reviews for a product
  async countByProduct(productId) {
    const result = await query(
      `SELECT COUNT(*) AS total FROM reviews WHERE product_id = $1`,
      [productId]
    );
    return parseInt(result.rows[0].total, 10);
  },

  // Rating breakdown distribution { 5: count, 4: count, ... }
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

  // Summary statistics for Cartify user reviews
  async ratingSummary(productId) {
    const breakdownResult = await query(
      `SELECT rating, COUNT(*) AS count
       FROM reviews
       WHERE product_id = $1
       GROUP BY rating`,
      [productId]
    );

    const aggResult = await query(
      `SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0) AS avg_rating,
              COUNT(*) AS total_reviews
       FROM reviews
       WHERE product_id = $1`,
      [productId]
    );

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const row of breakdownResult.rows) {
      breakdown[row.rating] = parseInt(row.count, 10);
    }

    return {
      averageRating: parseFloat(aggResult.rows[0].avg_rating),
      totalReviews: parseInt(aggResult.rows[0].total_reviews, 10),
      breakdown,
    };
  },

  // Inserts a new review row
  async create({ productId, userId, reviewerName, rating, reviewText }) {
    const result = await query(
      `INSERT INTO reviews (product_id, user_id, reviewer_name, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, product_id, user_id, reviewer_name, rating, review_text, created_at`,
      [productId, userId, reviewerName, rating, reviewText]
    );
    return result.rows[0];
  },

  // Finds review by internal ID
  async findById(reviewId) {
    const result = await query(
      `SELECT id, product_id, user_id, reviewer_name, rating, review_text, created_at
       FROM reviews
       WHERE id = $1`,
      [reviewId]
    );
    return result.rows[0] || null;
  },

  // Checks if user has already reviewed a product
  async findByUserAndProduct(userId, productId) {
    const result = await query(
      `SELECT id, product_id, user_id, reviewer_name, rating, review_text, created_at
       FROM reviews
       WHERE user_id = $1 AND product_id = $2`,
      [userId, productId]
    );
    return result.rows[0] || null;
  },

  // Updates an existing review owned by user
  async updateByIdAndUser(reviewId, userId, { rating, reviewText }, isAdmin = false) {
    const updates = [];
    const params = [reviewId];
    let idx = 2;

    if (rating !== undefined) {
      updates.push(`rating = $${idx}`);
      params.push(rating);
      idx++;
    }

    if (reviewText !== undefined) {
      updates.push(`review_text = $${idx}`);
      params.push(reviewText);
      idx++;
    }

    if (updates.length === 0) return this.findById(reviewId);

    let where = 'id = $1';
    if (!isAdmin) {
      where += ` AND user_id = $${idx}`;
      params.push(userId);
    }

    const result = await query(
      `UPDATE reviews
       SET ${updates.join(', ')}
       WHERE ${where}
       RETURNING id, product_id, user_id, reviewer_name, rating, review_text, created_at`,
      params
    );

    return result.rows[0] || null;
  },

  // Deletes review if owned by user or by an admin
  async deleteByIdAndUser(reviewId, userId, isAdmin = false) {
    let sql = `DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id, product_id`;
    let params = [reviewId, userId];

    if (isAdmin) {
      sql = `DELETE FROM reviews WHERE id = $1 RETURNING id, product_id`;
      params = [reviewId];
    }

    const result = await query(sql, params);
    return result.rows[0] || null;
  },
};
