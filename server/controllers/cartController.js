import { CartService } from '../services/cartService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateAddToCart, validateUpdateCartQuantity } from '../validators/cartValidators.js';
import { AppError } from '../middleware/errorMiddleware.js';

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const cart = await CartService.getCart(req.user.id);
  res.status(200).json({ success: true, data: cart });
});

// POST /api/cart
export const addToCart = asyncHandler(async (req, res) => {
  const { valid, errors, data } = validateAddToCart(req.body);
  if (!valid) {
    throw new AppError('Invalid cart data.', 422, errors);
  }

  const cart = await CartService.addItem({
    userId: req.user.id,
    productId: data.productId,
    quantity: data.quantity,
  });

  res.status(201).json({
    success: true,
    message: 'Item added to cart successfully.',
    data: cart,
  });
});

// PUT /api/cart/:productId
export const updateCartItem = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!Number.isFinite(productId) || productId <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const { valid, errors, data } = validateUpdateCartQuantity(req.body);
  if (!valid) {
    throw new AppError('Invalid quantity value.', 422, errors);
  }

  const cart = await CartService.updateQuantity({
    userId: req.user.id,
    productId,
    quantity: data.quantity,
  });

  res.status(200).json({
    success: true,
    message: 'Cart updated successfully.',
    data: cart,
  });
});

// DELETE /api/cart/:productId
export const removeFromCart = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!Number.isFinite(productId) || productId <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const cart = await CartService.removeItem({
    userId: req.user.id,
    productId,
  });

  res.status(200).json({
    success: true,
    message: 'Item removed from cart.',
    data: cart,
  });
});

// DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await CartService.clearCart(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully.',
    data: cart,
  });
});
