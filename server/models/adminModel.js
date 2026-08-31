import { query } from '../config/db.js';

export const AdminModel = {
  // Computes live catalogue health metrics strictly from PostgreSQL data
  async getCatalogueHealth() {
    const [overallRes, categoryRes, stockRes] = await Promise.all([
      query(`
        SELECT
          COUNT(*) AS total_products,
          COUNT(*) FILTER (WHERE is_active = true) AS active_products,
          COUNT(*) FILTER (WHERE is_active = false) AS inactive_products,
          COUNT(*) FILTER (WHERE main_image IS NULL OR main_image = '') AS missing_images,
          COUNT(*) FILTER (WHERE description IS NULL OR description = '') AS missing_descriptions,
          COUNT(*) FILTER (WHERE rating IS NULL OR rating = 0) AS unrated_products,
          COUNT(*) FILTER (WHERE brand IS NULL OR brand = '') AS missing_brands,
          COUNT(*) FILTER (WHERE source = 'amazon') AS amazon_products,
          COUNT(*) FILTER (WHERE source = 'internal') AS internal_products
        FROM products
      `),
      query(`
        SELECT
          c.id AS category_id,
          c.name AS category_name,
          c.slug AS category_slug,
          COUNT(p.id) AS product_count,
          COUNT(p.id) FILTER (WHERE p.is_active = true) AS active_count,
          COALESCE(AVG(p.final_price), 0) AS average_price,
          COALESCE(AVG(p.rating), 0) AS average_rating
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        GROUP BY c.id, c.name, c.slug
        ORDER BY product_count DESC
      `),
      query(`
        SELECT
          COALESCE(SUM(stock_quantity), 0) AS total_inventory_units,
          COUNT(*) FILTER (WHERE stock_quantity = 0) AS out_of_stock_products,
          COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity <= 5) AS low_stock_products
        FROM products
        WHERE is_active = true
      `),
    ]);

    const stats = overallRes.rows[0];
    const stock = stockRes.rows[0];

    return {
      totalProducts: parseInt(stats.total_products, 10),
      activeProducts: parseInt(stats.active_products, 10),
      inactiveProducts: parseInt(stats.inactive_products, 10),
      provenance: {
        amazon: parseInt(stats.amazon_products, 10),
        internal: parseInt(stats.internal_products, 10),
      },
      dataQuality: {
        missingImages: parseInt(stats.missing_images, 10),
        missingDescriptions: parseInt(stats.missing_descriptions, 10),
        unratedProducts: parseInt(stats.unrated_products, 10),
        missingBrands: parseInt(stats.missing_brands, 10),
      },
      inventory: {
        totalUnits: parseInt(stock.total_inventory_units, 10),
        outOfStockCount: parseInt(stock.out_of_stock_products, 10),
        lowStockCount: parseInt(stock.low_stock_products, 10),
      },
      categoryDistribution: categoryRes.rows.map((r) => ({
        categoryId: parseInt(r.category_id, 10),
        name: r.category_name,
        slug: r.category_slug,
        productCount: parseInt(r.product_count, 10),
        activeCount: parseInt(r.active_count, 10),
        averagePrice: Math.round(parseFloat(r.average_price) * 100) / 100,
        averageRating: Math.round(parseFloat(r.average_rating) * 10) / 10,
      })),
    };
  },

  // Computes interaction analytics from PostgreSQL interactions table
  async getInteractionAnalytics(timeframe = 'all') {
    let whereClause = '';
    if (timeframe === '24h') {
      whereClause = "WHERE created_at >= NOW() - INTERVAL '24 hours'";
    } else if (timeframe === '7d') {
      whereClause = "WHERE created_at >= NOW() - INTERVAL '7 days'";
    } else if (timeframe === '30d') {
      whereClause = "WHERE created_at >= NOW() - INTERVAL '30 days'";
    }

    const [breakdownRes, summaryRes] = await Promise.all([
      query(`
        SELECT
          interaction_type,
          COUNT(*) AS event_count,
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS unique_users,
          COUNT(DISTINCT session_id) AS unique_sessions,
          COUNT(DISTINCT product_id) FILTER (WHERE product_id IS NOT NULL) AS unique_products
        FROM interactions
        ${whereClause}
        GROUP BY interaction_type
        ORDER BY event_count DESC
      `),
      query(`
        SELECT
          COUNT(*) AS total_events,
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) AS total_users,
          COUNT(DISTINCT session_id) AS total_sessions
        FROM interactions
        ${whereClause}
      `),
    ]);

    const summary = summaryRes.rows[0];

    return {
      timeframe,
      totalEvents: parseInt(summary.total_events || 0, 10),
      uniqueUsers: parseInt(summary.total_users || 0, 10),
      uniqueSessions: parseInt(summary.total_sessions || 0, 10),
      byType: breakdownRes.rows.map((r) => ({
        interactionType: r.interaction_type,
        eventCount: parseInt(r.event_count, 10),
        uniqueUsers: parseInt(r.unique_users, 10),
        uniqueSessions: parseInt(r.unique_sessions, 10),
        uniqueProducts: parseInt(r.unique_products, 10),
      })),
    };
  },
};
