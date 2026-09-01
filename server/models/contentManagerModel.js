import { query } from '../config/db.js';

export const ContentManagerModel = {
  // Lists products with admin/content-manager filters (including inactive products)
  async listProducts({ page = 1, limit = 20, category = null, isActive = null, search = null, sort = 'created_desc' }) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (category) {
      conditions.push(`(c.slug = $${idx} OR c.name ILIKE $${idx})`);
      params.push(category);
      idx++;
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(`p.is_active = $${idx}`);
      params.push(isActive === 'true' || isActive === true);
      idx++;
    }

    if (search) {
      conditions.push(`(p.search_vector @@ plainto_tsquery('english', $${idx}) OR p.name ILIKE $${idx + 1} OR p.source_id ILIKE $${idx + 1})`);
      params.push(search, `%${search}%`);
      idx += 2;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.final_price ASC';
    else if (sort === 'price_desc') orderBy = 'p.final_price DESC';
    else if (sort === 'name_asc') orderBy = 'p.name ASC';
    else if (sort === 'stock_asc') orderBy = 'p.stock_quantity ASC';

    const offset = (page - 1) * limit;
    params.push(limit, offset);
    const limitIdx = idx;
    const offsetIdx = idx + 1;

    const [countRes, rowsRes] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total
         FROM products p
         JOIN categories c ON c.id = p.category_id
         ${where}`,
        params.slice(0, limitIdx - 1)
      ),
      query(
        `SELECT
           p.id,
           p.source,
           p.source_id,
           p.name,
           p.slug,
           p.brand,
           p.category_id,
           c.name AS category_name,
           c.slug AS category_slug,
           p.subcategory,
           p.price,
           p.discount_percentage,
           p.final_price,
           p.rating,
           p.review_count,
           p.stock_quantity,
           p.seller_name,
           p.main_image,
           p.is_active,
           p.created_at,
           p.updated_at
         FROM products p
         JOIN categories c ON c.id = p.category_id
         ${where}
         ORDER BY ${orderBy}
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        params
      ),
    ]);

    return {
      products: rowsRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
    };
  },

  // Inserts a new internal product
  async createProduct({
    source = 'internal',
    sourceId,
    name,
    slug,
    brand = 'Cartify Brand',
    categoryId,
    subcategory = null,
    description = '',
    shortDescription = '',
    price,
    discountPercentage = 0,
    finalPrice,
    stockQuantity = 50,
    sellerName = 'Cartify Verified Seller',
    mainImage,
    images = [],
    specifications = {},
    isActive = true,
    verificationStatus = 'VERIFIED',
  }) {
    const result = await query(
      `INSERT INTO products (
         source, source_id, name, slug, brand, category_id, subcategory,
         description, short_description, price, discount_percentage, final_price,
         rating, review_count, stock_quantity, seller_name, main_image, images,
         specifications, is_active, verification_status, search_vector, created_at, updated_at
       )
       VALUES (
         $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::int, $7::varchar,
         $8::text, $9::varchar, $10::numeric, $11::numeric, $12::numeric,
         NULL, 0, $13::int, $14::varchar, $15::text, $16::jsonb,
         $17::jsonb, $18::boolean, $19::varchar,
         setweight(to_tsvector('english', coalesce($3::varchar, '')), 'A') ||
         setweight(to_tsvector('english', coalesce($5::varchar, '')), 'B') ||
         setweight(to_tsvector('english', coalesce($8::text, '')), 'C'),
         NOW(), NOW()
       )
       RETURNING *`,
      [
        source,
        sourceId,
        name,
        slug,
        brand,
        categoryId,
        subcategory,
        description,
        shortDescription,
        price,
        discountPercentage,
        finalPrice,
        stockQuantity,
        sellerName,
        mainImage,
        JSON.stringify(images),
        JSON.stringify(specifications),
        isActive,
        verificationStatus,
      ]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  // Updates product metadata via allowlist
  async updateProduct(id, fields) {
    const allowedFields = [
      'name',
      'brand',
      'category_id',
      'subcategory',
      'description',
      'short_description',
      'price',
      'discount_percentage',
      'final_price',
      'stock_quantity',
      'seller_name',
      'is_active',
      'verification_status',
      'main_image',
      'images',
      'specifications',
    ];

    const setClauses = [];
    const params = [id];
    let idx = 2;

    for (const key of allowedFields) {
      if (fields[key] !== undefined) {
        if (['images', 'specifications'].includes(key)) {
          setClauses.push(`${key} = $${idx}`);
          params.push(JSON.stringify(fields[key]));
        } else {
          setClauses.push(`${key} = $${idx}`);
          params.push(fields[key]);
        }
        idx++;
      }
    }

    if (fields.name || fields.brand || fields.description) {
      setClauses.push(`search_vector = setweight(to_tsvector('english', coalesce(products.name, '')), 'A') ||
                                     setweight(to_tsvector('english', coalesce(products.brand, '')), 'B') ||
                                     setweight(to_tsvector('english', coalesce(products.description, '')), 'C')`);
    }

    setClauses.push('updated_at = NOW()');

    const result = await query(
      `UPDATE products
       SET ${setClauses.join(', ')}
       WHERE id = $1
       RETURNING *`,
      params
    );

    return result.rows[0] || null;
  },

  // Updates main image and additional gallery images
  async updateImages(id, { mainImage, images = [] }) {
    const result = await query(
      `UPDATE products
       SET main_image = $2,
           images = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, main_image, images, updated_at`,
      [id, mainImage, JSON.stringify(images)]
    );
    return result.rows[0] || null;
  },

  // Creates a category
  async createCategory({ name, slug, description = '', imageUrl = null, isActive = true }) {
    const result = await query(
      `INSERT INTO categories (name, slug, description, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, slug, description, image_url, is_active, created_at`,
      [name, slug, description, imageUrl, isActive]
    );
    return result.rows[0];
  },

  // Updates a category
  async updateCategory(id, { name, description, imageUrl, isActive }) {
    const setClauses = [];
    const params = [id];
    let idx = 2;

    if (name !== undefined) {
      setClauses.push(`name = $${idx}`);
      params.push(name);
      idx++;
    }
    if (description !== undefined) {
      setClauses.push(`description = $${idx}`);
      params.push(description);
      idx++;
    }
    if (imageUrl !== undefined) {
      setClauses.push(`image_url = $${idx}`);
      params.push(imageUrl);
      idx++;
    }
    if (isActive !== undefined) {
      setClauses.push(`is_active = $${idx}`);
      params.push(isActive);
      idx++;
    }

    if (setClauses.length === 0) {
      const res = await query('SELECT * FROM categories WHERE id = $1', [id]);
      return res.rows[0] || null;
    }

    const result = await query(
      `UPDATE categories
       SET ${setClauses.join(', ')}
       WHERE id = $1
       RETURNING id, name, slug, description, image_url, is_active, created_at`,
      params
    );
    return result.rows[0] || null;
  },

  // Checks if active products exist in category before deletion
  async countProductsInCategory(categoryId) {
    const result = await query(
      `SELECT COUNT(*) AS count FROM products WHERE category_id = $1`,
      [categoryId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  // Deletes category if no products depend on it
  async deleteCategory(id) {
    const result = await query(
      `DELETE FROM categories WHERE id = $1 RETURNING id, name, slug`,
      [id]
    );
    return result.rows[0] || null;
  },
};
