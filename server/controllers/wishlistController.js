import { WishlistService } from '../services/wishlistService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateWishlistAction } from '../validators/wishlistValidators.js';
import { AppError } from '../middleware/errorMiddleware.js';

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await WishlistService.getWishlist(req.user.id);
  res.status(200).json({ success: true, data: wishlist });
});

// GET /api/wishlist/ids
export const getWishlistIds = asyncHandler(async (req, res) => {
  const ids = await WishlistService.getWishlistIds(req.user.id);
  res.status(200).json({ success: true, data: ids });
});

// GET /api/wishlist/check/:productId
export const checkWishlist = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!Number.isFinite(productId) || productId <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const isWishlisted = await WishlistService.checkItem(req.user.id, productId);
  res.status(200).json({
    success: true,
    data: {
      productId,
      isWishlisted,
    },
  });
});

// POST /api/wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
  const { valid, errors, data } = validateWishlistAction(req.body);
  if (!valid) {
    throw new AppError('Invalid wishlist data.', 422, errors);
  }

  const wishlist = await WishlistService.addItem({
    userId: req.user.id,
    productId: data.productId,
  });

  res.status(201).json({
    success: true,
    message: 'Item added to wishlist.',
    data: wishlist,
  });
});

// DELETE /api/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!Number.isFinite(productId) || productId <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const wishlist = await WishlistService.removeItem({
    userId: req.user.id,
    productId,
  });

  res.status(200).json({
    success: true,
    message: 'Item removed from wishlist.',
    data: wishlist,
  });
});

// POST /api/wishlist/move-to-cart/:productId
export const moveToCart = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!Number.isFinite(productId) || productId <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const result = await WishlistService.moveToCart({
    userId: req.user.id,
    productId,
    quantity: req.body.quantity || 1,
  });

  res.status(200).json({
    success: true,
    message: 'Item moved from wishlist to cart.',
    data: result,
  });
});

// DELETE /api/wishlist
export const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await WishlistService.clearWishlist(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Wishlist cleared.',
    data: wishlist,
  });
});
