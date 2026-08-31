import { query, pool } from '../config/db.js';

export const OrderModel = {
  // Creates order and order items in a transaction using the provided pg client
  async createOrderWithItems({ userId, totalAmount, shippingAddress, paymentMethod, paymentStatus, items }, client) {
    const dbClient = client || (await pool.connect());
    const ownClient = !client;

    try {
      if (ownClient) await dbClient.query('BEGIN');

      const orderResult = await dbClient.query(
        `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method, payment_status)
         VALUES ($1, $2, 'PENDING', $3, $4, $5)
         RETURNING id, user_id, total_amount, status, shipping_address, payment_method, payment_status, created_at, updated_at`,
        [userId, totalAmount, JSON.stringify(shippingAddress), paymentMethod, paymentStatus]
      );
      const order = orderResult.rows[0];

      const createdItems = [];
      for (const item of items) {
        const itemResult = await dbClient.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, order_id, product_id, quantity, unit_price, total_price`,
          [order.id, item.productId, item.quantity, item.unitPrice, item.totalPrice]
        );
        createdItems.push(itemResult.rows[0]);
      }

      if (ownClient) await dbClient.query('COMMIT');

      return {
        ...order,
        items: createdItems,
      };
    } catch (err) {
      if (ownClient) await dbClient.query('ROLLBACK');
      throw err;
    } finally {
      if (ownClient) dbClient.release();
    }
  },

  // Retrieves user's orders with count of items and pagination
  async findByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT
         o.id,
         o.user_id,
         o.total_amount,
         o.status,
         o.payment_method,
         o.payment_status,
         o.created_at,
         o.updated_at,
         COUNT(oi.id) AS item_count,
         COALESCE(SUM(oi.quantity), 0) AS total_quantity
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  // Counts total orders for user
  async countByUserId(userId) {
    const result = await query(
      `SELECT COUNT(*) AS total FROM orders WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0].total, 10);
  },

  // Finds order by ID
  async findById(orderId) {
    const result = await query(
      `SELECT
         id,
         user_id,
         total_amount,
         status,
         shipping_address,
         payment_method,
         payment_status,
         created_at,
         updated_at
       FROM orders
       WHERE id = $1`,
      [orderId]
    );
    return result.rows[0] || null;
  },

  // Finds historical order items with product metadata snapshot
  async findItemsByOrderId(orderId) {
    const result = await query(
      `SELECT
         oi.id,
         oi.order_id,
         oi.product_id,
         oi.quantity,
         oi.unit_price,
         oi.total_price,
         p.name AS product_name,
         p.brand AS product_brand,
         p.main_image AS product_main_image,
         p.slug AS product_slug
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [orderId]
    );
    return result.rows;
  },

  // Updates status of order
  async updateStatus(orderId, status, client = null) {
    const executor = client ? client.query.bind(client) : query;
    const result = await executor(
      `UPDATE orders
       SET status = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, total_amount, status, updated_at`,
      [orderId, status]
    );
    return result.rows[0] || null;
  },

  // Determines if user has purchased a product via a completed or non-cancelled order
  async hasUserPurchasedProduct(userId, productId) {
    const result = await query(
      `SELECT oi.id
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
         AND oi.product_id = $2
         AND o.status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED')
       LIMIT 1`,
      [userId, productId]
    );
    return (result.rowCount || 0) > 0;
  },
};
