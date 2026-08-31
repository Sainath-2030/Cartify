import { ReviewService } from '../services/reviewService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateReviewSubmission, validateReviewUpdate } from '../validators/reviewValidators.js';
import { AppError } from '../middleware/errorMiddleware.js';

// GET /api/products/:productId/reviews
export const getProductReviews = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!Number.isFinite(productId) || productId <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

  const result = await ReviewService.listProductReviews({ productId, page, limit });
  res.status(200).json({ success: true, data: result.reviews, pagination: result.pagination });
});

// GET /api/products/:productId/reviews/summary
export const getProductReviewSummary = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!Number.isFinite(productId) || productId <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const summary = await ReviewService.getProductReviewSummary(productId);
  res.status(200).json({ success: true, data: summary });
});

// POST /api/products/:productId/reviews
export const submitReview = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!Number.isFinite(productId) || productId <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const { valid, errors, data } = validateReviewSubmission(req.body);
  if (!valid) {
    throw new AppError('Invalid review data.', 422, errors);
  }

  const result = await ReviewService.submitReview({
    productId,
    user: req.user,
    rating: data.rating,
    reviewText: data.reviewText,
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for your review!',
    data: result,
  });
});

// PATCH /api/reviews/:reviewId
export const updateReview = asyncHandler(async (req, res) => {
  const reviewId = parseInt(req.params.reviewId, 10);
  if (!Number.isFinite(reviewId) || reviewId <= 0) {
    throw new AppError('Invalid review ID.', 400);
  }

  const { valid, errors, data } = validateReviewUpdate(req.body);
  if (!valid) {
    throw new AppError('Invalid review update data.', 422, errors);
  }

  const result = await ReviewService.updateReview({
    reviewId,
    user: req.user,
    rating: data.rating,
    reviewText: data.reviewText,
  });

  res.status(200).json({
    success: true,
    message: 'Review updated successfully.',
    data: result,
  });
});

// GET /api/products/:productId/reviews/me
export const getMyReview = asyncHandler(async (req, res) => {
  const productId = parseInt(req.params.productId, 10);
  if (!Number.isFinite(productId) || productId <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const review = await ReviewService.getUserReviewForProduct({
    productId,
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    data: review,
  });
});

// DELETE /api/reviews/:reviewId
export const deleteReview = asyncHandler(async (req, res) => {
  const reviewId = parseInt(req.params.reviewId, 10);
  if (!Number.isFinite(reviewId) || reviewId <= 0) {
    throw new AppError('Invalid review ID.', 400);
  }

  const result = await ReviewService.deleteReview({
    reviewId,
    user: req.user,
  });

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully.',
    data: result,
  });
});
