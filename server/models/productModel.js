import { query } from '../config/db.js';

const PRODUCT_LIST_COLUMNS = `
  p.id, p.name, p.slug, p.short_description, p.brand, p.price,
  p.discount_percentage, p.final_price, p.rating, p.review_count,
  p.stock_quantity, p.main_image, p.is_active, p.created_at,
  c.name AS category_name, c.slug AS category_slug
`;

const PRODUCT_DETAIL_COLUMNS = `
  p.id, p.name, p.slug, p.description, p.short_description, p.subcategory,
  p.brand, p.price, p.discount_percentage, p.final_price, p.rating,
  p.review_count, p.stock_quantity, p.seller_name, p.main_image, p.images,
  p.specifications, p.is_active, p.created_at, p.updated_at,
  c.id AS category_id, c.name AS category_name, c.slug AS category_slug
`;

const SORT_MAP = {
  price_asc: 'p.final_price ASC',
  price_desc: 'p.final_price DESC',
  rating: 'p.rating DESC, p.review_count DESC',
  newest: 'p.created_at DESC',
  popular: 'p.review_count DESC',
  featured: 'p.rating DESC, p.review_count DESC', // default "featured" ordering
};

// Builds a WHERE clause + params array from a normalized filter object.
// Shared by listProducts() and searchProducts() so filter behavior stays
// identical between /api/products and /api/products/search.
function buildFilters(filters, startIndex = 1) {
  const clauses = ['p.is_active = true'];
  const params = [];
  let idx = startIndex;

  if (filters.category) {
    clauses.push(`c.slug = $${idx}`);
    params.push(filters.category);
    idx += 1;
  }

  if (filters.brand) {
    clauses.push(`p.brand ILIKE $${idx}`);
    params.push(filters.brand);
    idx += 1;
  }

  if (filters.minPrice !== undefined) {
    clauses.push(`p.final_price >= $${idx}`);
    params.push(filters.minPrice);
    idx += 1;
  }

  if (filters.maxPrice !== undefined) {
    clauses.push(`p.final_price <= $${idx}`);
    params.push(filters.maxPrice);
    idx += 1;
  }

  if (filters.rating !== undefined) {
    clauses.push(`p.rating >= $${idx}`);
    params.push(filters.rating);
    idx += 1;
  }

  if (filters.inStock) {
    clauses.push('p.stock_quantity > 0');
  }

  if (filters.q) {
    clauses.push(`p.search_vector @@ plainto_tsquery('english', $${idx})`);
    params.push(filters.q);
    idx += 1;
  }

  return { whereClause: clauses.join(' AND '), params, nextIndex: idx };
}

export const ProductModel = {
  async list({ filters, sort, page, limit }) {
    const { whereClause, params, nextIndex } = buildFilters(filters);
    const orderBy = SORT_MAP[sort] || SORT_MAP.featured;
    const offset = (page - 1) * limit;

    const dataParams = [...params, limit, offset];
    const dataResult = await query(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
      dataParams
    );

    const countResult = await query(
      `SELECT COUNT(*) AS total
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${whereClause}`,
      params
    );

    return {
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  },

  // Distinct brand list, optionally scoped to a category — powers the
  // brand filter checkboxes in the catalogue sidebar.
  async listBrands(categorySlug) {
    const params = [];
    let where = 'p.is_active = true';
    if (categorySlug) {
      where += ' AND c.slug = $1';
      params.push(categorySlug);
    }
    const result = await query(
      `SELECT DISTINCT p.brand
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where}
       ORDER BY p.brand ASC`,
      params
    );
    return result.rows.map((r) => r.brand);
  },

  async findBySlug(slug) {
    const result = await query(
      `SELECT ${PRODUCT_DETAIL_COLUMNS}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = $1 AND p.is_active = true`,
      [slug]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await query(
      `SELECT ${PRODUCT_DETAIL_COLUMNS}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );
    return result.rows[0] || null;
  },

  // A handful of same-category products, for the "Related Products" shelf.
  async findRelated(categoryId, excludeProductId, limit = 4) {
    if (!categoryId) return [];
    const result = await query(
      `SELECT ${PRODUCT_LIST_COLUMNS}
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.category_id = $1 AND p.id != $2 AND p.is_active = true
       ORDER BY p.rating DESC
       LIMIT $3`,
      [categoryId, excludeProductId, limit]
    );
    return result.rows;
  },

  async listByCategory({ categorySlug, filters, sort, page, limit }) {
    return this.list({ filters: { ...filters, category: categorySlug }, sort, page, limit });
  },
};
