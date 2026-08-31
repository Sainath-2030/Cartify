import { query } from '../config/db.js';

export const CategoryModel = {
  async findAll() {
    const result = await query(
      `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.image_url AS image, c.created_at,
              COUNT(p.id) FILTER (WHERE p.is_active = true) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return result.rows;
  },

  async findBySlug(slug) {
    const result = await query(
      `SELECT c.id, c.name, c.slug, c.description, c.image_url, c.image_url AS image, c.created_at,
              COUNT(p.id) FILTER (WHERE p.is_active = true) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       WHERE c.slug = $1
       GROUP BY c.id`,
      [slug]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  },
};
