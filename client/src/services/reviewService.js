import { api } from './api.js';

export const reviewService = {
  // Submit a review for a product
  submitReview(productId, payload) {
    return api.post(`/products/${productId}/reviews`, payload);
  },

  // Get current user's review for a product
  getMyReview(productId) {
    return api.get(`/products/${productId}/reviews/me`);
  },

  // Delete a review
  deleteReview(reviewId) {
    return api.delete(`/reviews/${reviewId}`);
  },
};
