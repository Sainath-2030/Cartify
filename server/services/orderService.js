import { OrderModel } from '../models/orderModel.js';
import { CartModel } from '../models/cartModel.js';
import { ProductModel } from '../models/productModel.js';
import { InteractionService } from './interactionService.js';
import { pool } from '../config/db.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const OrderService = {
  // Previews checkout calculations from current cart
  async previewCheckout(userId) {
    const rawCart = await CartModel.findByUserId(userId);
    if (!rawCart || rawCart.length === 0) {
      throw new AppError('Your cart is empty. Add items before checking out.', 422, {
        cart: 'Empty cart cannot be checked out.',
      });
    }

    let subtotal = 0;
    let totalQuantity = 0;
    const items = [];

    for (const item of rawCart) {
      if (!item.is_active) {
        throw new AppError(`"${item.name}" is no longer available. Please remove it from your cart.`, 422);
      }
      if (item.quantity > item.stock_quantity) {
        throw new AppError(`Requested quantity (${item.quantity}) for "${item.name}" exceeds available stock (${item.stock_quantity}).`, 422);
      }

      const unitPrice = parseFloat(item.final_price);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      subtotal += lineTotal;
      totalQuantity += item.quantity;

      items.push({
        productId: parseInt(item.product_id, 10),
        name: item.name,
        brand: item.brand,
        mainImage: item.main_image,
        unitPrice,
        quantity: item.quantity,
        totalPrice: lineTotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    return {
      items,
      itemCount: items.length,
      totalQuantity,
      subtotal,
      shippingFee: 0,
      totalAmount: subtotal,
      currency: 'INR',
    };
  },

  // Creates order from user's current cart inside an ACID PostgreSQL transaction
  async createOrder({ userId, shippingAddress, paymentMethod = 'COD' }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Fetch user's cart items with latest product prices and stocks
      const cartResult = await client.query(
        `SELECT
           ci.id AS cart_item_id,
           ci.quantity,
           p.id AS product_id,
           p.name,
           p.brand,
           p.final_price,
           p.stock_quantity,
           p.is_active,
           p.main_image
         FROM cart_items ci
         JOIN products p ON p.id = ci.product_id
         WHERE ci.user_id = $1
         FOR UPDATE OF p`,
        [userId]
      );

      const cartItems = cartResult.rows;
      if (!cartItems || cartItems.length === 0) {
        throw new AppError('Your cart is empty. Add products before placing an order.', 422, {
          cart: 'Cart is empty.',
        });
      }

      let totalAmount = 0;
      const orderItemsToCreate = [];

      // 2. Validate items, prices, and decrement stock
      for (const item of cartItems) {
        if (!item.is_active) {
          throw new AppError(`Product "${item.name}" is no longer available.`, 422);
        }

        const qty = parseInt(item.quantity, 10);
        const stock = parseInt(item.stock_quantity, 10);

        if (qty <= 0) {
          throw new AppError(`Invalid quantity for "${item.name}".`, 422);
        }

        if (qty > stock) {
          throw new AppError(
            `Insufficient stock for "${item.name}". Requested: ${qty}, Available: ${stock}.`,
            422,
            { stock: `Only ${stock} unit(s) available.` }
          );
        }

        // Authoritative price snapshot
        const unitPrice = parseFloat(item.final_price);
        const lineTotal = Math.round(unitPrice * qty * 100) / 100;
        totalAmount += lineTotal;

        orderItemsToCreate.push({
          productId: parseInt(item.product_id, 10),
          quantity: qty,
          unitPrice,
          totalPrice: lineTotal,
          name: item.name,
          brand: item.brand,
          mainImage: item.main_image,
        });

        // Decrement stock atomically
        await client.query(
          `UPDATE products
           SET stock_quantity = stock_quantity - $1,
               updated_at = NOW()
           WHERE id = $2`,
          [qty, item.product_id]
        );
      }

      totalAmount = Math.round(totalAmount * 100) / 100;

      // 3. Create order header
      const orderInsert = await client.query(
        `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method, payment_status)
         VALUES ($1, $2, 'PENDING', $3, $4, 'PAID')
         RETURNING id, user_id, total_amount, status, shipping_address, payment_method, payment_status, created_at, updated_at`,
        [userId, totalAmount, JSON.stringify(shippingAddress), paymentMethod]
      );
      const createdOrder = orderInsert.rows[0];

      // 4. Create order items snapshot
      const createdItems = [];
      for (const item of orderItemsToCreate) {
        const itemInsert = await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, order_id, product_id, quantity, unit_price, total_price`,
          [createdOrder.id, item.productId, item.quantity, item.unitPrice, item.totalPrice]
        );
        createdItems.push({
          id: parseInt(itemInsert.rows[0].id, 10),
          productId: item.productId,
          productName: item.name,
          productBrand: item.brand,
          productMainImage: item.mainImage,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
      }

      // 5. Clear user's cart
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      // 6. Commit transaction
      await client.query('COMMIT');

      // 7. Emit authoritative PURCHASE telemetry for each ordered item
      for (const item of createdItems) {
        await InteractionService.recordTrusted({
          userId,
          productId: item.productId,
          interactionType: 'PURCHASE',
          metadata: {
            orderId: parseInt(createdOrder.id, 10),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          },
        });
      }

      return {
        id: parseInt(createdOrder.id, 10),
        userId: parseInt(createdOrder.user_id, 10),
        totalAmount: parseFloat(createdOrder.total_amount),
        status: createdOrder.status,
        shippingAddress: createdOrder.shipping_address,
        paymentMethod: createdOrder.payment_method,
        paymentStatus: createdOrder.payment_status,
        items: createdItems,
        itemCount: createdItems.length,
        createdAt: createdOrder.created_at,
        updatedAt: createdOrder.updated_at,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Retrieves user's orders list
  async getUserOrders({ userId, page = 1, limit = 10 }) {
    const [rows, total] = await Promise.all([
      OrderModel.findByUserId(userId, page, limit),
      OrderModel.countByUserId(userId),
    ]);

    const orders = rows.map((o) => ({
      id: parseInt(o.id, 10),
      totalAmount: parseFloat(o.total_amount),
      status: o.status,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      itemCount: parseInt(o.item_count, 10),
      totalQuantity: parseInt(o.total_quantity, 10),
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  // Retrieves order details with item snapshot
  async getOrderById({ orderId, userId, isAdmin = false }) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    if (!isAdmin && parseInt(order.user_id, 10) !== parseInt(userId, 10)) {
      throw new AppError('You do not have permission to view this order.', 403);
    }

    const items = await OrderModel.findItemsByOrderId(orderId);

    return {
      id: parseInt(order.id, 10),
      userId: parseInt(order.user_id, 10),
      totalAmount: parseFloat(order.total_amount),
      status: order.status,
      shippingAddress: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: items.map((i) => ({
        id: parseInt(i.id, 10),
        productId: parseInt(i.product_id, 10),
        productName: i.product_name,
        productBrand: i.product_brand,
        productMainImage: i.product_main_image,
        productSlug: i.product_slug,
        quantity: parseInt(i.quantity, 10),
        unitPrice: parseFloat(i.unit_price),
        totalPrice: parseFloat(i.total_price),
      })),
    };
  },

  // Cancels an order if eligible (PENDING or PROCESSING)
  async cancelOrder({ orderId, userId, isAdmin = false }) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    if (!isAdmin && parseInt(order.user_id, 10) !== parseInt(userId, 10)) {
      throw new AppError('You do not have permission to cancel this order.', 403);
    }

    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      throw new AppError(`Cannot cancel order in "${order.status}" status. Only PENDING or PROCESSING orders can be cancelled.`, 422);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update status
      const updated = await OrderModel.updateStatus(orderId, 'CANCELLED', client);

      // Restore stock for items
      const items = await OrderModel.findItemsByOrderId(orderId);
      for (const item of items) {
        await client.query(
          `UPDATE products
           SET stock_quantity = stock_quantity + $1,
               updated_at = NOW()
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }

      await client.query('COMMIT');

      return {
        id: parseInt(updated.id, 10),
        status: updated.status,
        updatedAt: updated.updated_at,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Verifies if a user has purchased a product
  async hasUserPurchasedProduct(userId, productId) {
    return OrderModel.hasUserPurchasedProduct(userId, productId);
  },
};
