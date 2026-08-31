import { OrderService } from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateCreateOrder, validateOrderQuery } from '../validators/orderValidators.js';
import { AppError } from '../middleware/errorMiddleware.js';

// GET /api/orders/preview
export const previewCheckout = asyncHandler(async (req, res) => {
  const preview = await OrderService.previewCheckout(req.user.id);
  res.status(200).json({ success: true, data: preview });
});

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { valid, errors, data } = validateCreateOrder(req.body);
  if (!valid) {
    throw new AppError('Invalid order details.', 422, errors);
  }

  const order = await OrderService.createOrder({
    userId: req.user.id,
    shippingAddress: data.shippingAddress,
    paymentMethod: data.paymentMethod,
  });

  res.status(201).json({
    success: true,
    message: 'Order placed successfully.',
    data: order,
  });
});

// GET /api/orders
export const getUserOrders = asyncHandler(async (req, res) => {
  const { page, limit } = validateOrderQuery(req.query);
  const result = await OrderService.getUserOrders({
    userId: req.user.id,
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    data: result.orders,
    pagination: result.pagination,
  });
});

// GET /api/orders/:orderId
export const getOrderById = asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new AppError('Invalid order ID.', 400);
  }

  const isAdmin = req.user.role === 'ADMIN';
  const order = await OrderService.getOrderById({
    orderId,
    userId: req.user.id,
    isAdmin,
  });

  res.status(200).json({
    success: true,
    data: order,
  });
});

// PATCH /api/orders/:orderId/cancel
export const cancelOrder = asyncHandler(async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new AppError('Invalid order ID.', 400);
  }

  const isAdmin = req.user.role === 'ADMIN';
  const result = await OrderService.cancelOrder({
    orderId,
    userId: req.user.id,
    isAdmin,
  });

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully.',
    data: result,
  });
});
