import { ReviewModel } from '../models/reviewModel.js';
import { ProductModel } from '../models/productModel.js';
import { UserModel } from '../models/userModel.js';
import { OrderService } from './orderService.js';
import { InteractionService } from './interactionService.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const ReviewService = {
  // Lists paginated reviews for a product
  async listProductReviews({ productId, page = 1, limit = 10 }) {
    const product = await ProductModel.findById(productId);
    if (!product || !product.is_active) {
      throw new AppError('Product not found or is unavailable.', 404);
    }

    const [rows, total] = await Promise.all([
      ReviewModel.findByProductPaginated(productId, page, limit),
      ReviewModel.countByProduct(productId),
    ]);

    const reviews = await Promise.all(
      rows.map(async (r) => {
        const isVerified = r.user_id ? await OrderService.hasUserPurchasedProduct(r.user_id, productId) : false;
        return {
          id: parseInt(r.id, 10),
          productId: parseInt(r.product_id, 10),
          reviewerName: r.reviewer_name,
          rating: parseInt(r.rating, 10),
          reviewText: r.review_text,
          verifiedPurchase: isVerified,
          createdAt: r.created_at,
        };
      })
    );

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  // Returns rating breakdown & summary for a product
  async getProductReviewSummary(productId) {
    const product = await ProductModel.findById(productId);
    if (!product || !product.is_active) {
      throw new AppError('Product not found or is unavailable.', 404);
    }

    return ReviewModel.ratingSummary(productId);
  },

  // Submit a new review
  async submitReview({ productId, user, rating, reviewText }) {
    const product = await ProductModel.findById(productId);
    if (!product || !product.is_active) {
      throw new AppError('Product not found or unavailable.', 404);
    }

    // Check for duplicate review from same user
    const existing = await ReviewModel.findByUserAndProduct(user.id, productId);
    if (existing) {
      throw new AppError('You have already submitted a review for this product.', 409, {
        review: 'Duplicate review not allowed for this product.',
      });
    }

    // Fetch user details to get real full_name
    const dbUser = await UserModel.findById(user.id);
    const reviewerName = dbUser?.full_name || user.email?.split('@')[0] || 'Cartify Shopper';

    const review = await ReviewModel.create({
      productId,
      userId: user.id,
      reviewerName,
      rating,
      reviewText,
    });

    // Emit REVIEW and RATING telemetry events
    await InteractionService.recordTrusted({
      userId: user.id,
      productId,
      interactionType: 'REVIEW',
      metadata: { reviewId: parseInt(review.id, 10), rating },
    });

    await InteractionService.recordTrusted({
      userId: user.id,
      productId,
      interactionType: 'RATING',
      metadata: { rating },
    });

    return {
      id: parseInt(review.id, 10),
      productId: parseInt(review.product_id, 10),
      reviewerName: review.reviewer_name,
      rating: parseInt(review.rating, 10),
      reviewText: review.review_text,
      verifiedPurchase: false,
      createdAt: review.created_at,
    };
  },

  // Updates an existing review (only review owner or admin)
  async updateReview({ reviewId, user, rating, reviewText }) {
    const existing = await ReviewModel.findById(reviewId);
    if (!existing) {
      throw new AppError('Review not found.', 404);
    }

    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && parseInt(existing.user_id, 10) !== parseInt(user.id, 10)) {
      throw new AppError('You do not have permission to edit this review.', 403);
    }

    const updated = await ReviewModel.updateByIdAndUser(reviewId, user.id, { rating, reviewText }, isAdmin);
    if (!updated) {
      throw new AppError('Review not found or could not be updated.', 404);
    }

    return {
      id: parseInt(updated.id, 10),
      productId: parseInt(updated.product_id, 10),
      reviewerName: updated.reviewer_name,
      rating: parseInt(updated.rating, 10),
      reviewText: updated.review_text,
      verifiedPurchase: false,
      createdAt: updated.created_at,
    };
  },

  // Delete a review (only owner or admin)
  async deleteReview({ reviewId, user }) {
    const existing = await ReviewModel.findById(reviewId);
    if (!existing) {
      throw new AppError('Review not found.', 404);
    }

    const isAdmin = user.role === 'ADMIN';
    if (!isAdmin && parseInt(existing.user_id, 10) !== parseInt(user.id, 10)) {
      throw new AppError('You do not have permission to delete this review.', 403);
    }

    const deleted = await ReviewModel.deleteByIdAndUser(reviewId, user.id, isAdmin);
    return {
      reviewId: parseInt(deleted.id, 10),
      productId: parseInt(deleted.product_id, 10),
    };
  },

  // Get current user's review for a product if exists
  async getUserReviewForProduct({ productId, userId }) {
    const review = await ReviewModel.findByUserAndProduct(userId, productId);
    if (!review) return null;
    const isVerified = await OrderService.hasUserPurchasedProduct(userId, productId);
    return {
      id: parseInt(review.id, 10),
      productId: parseInt(review.product_id, 10),
      reviewerName: review.reviewer_name,
      rating: parseInt(review.rating, 10),
      reviewText: review.review_text,
      verifiedPurchase: isVerified,
      createdAt: review.created_at,
    };
  },
};
