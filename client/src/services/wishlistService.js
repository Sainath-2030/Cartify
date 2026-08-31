import { api } from './api.js';

export const wishlistService = {
  // Get current user's full wishlist
  getWishlist() {
    return api.get('/wishlist');
  },

  // Get wishlisted product IDs array for O(1) icon checks
  getWishlistIds() {
    return api.get('/wishlist/ids');
  },

  // Add a product to wishlist
  addItem(productId) {
    return api.post('/wishlist', { productId });
  },

  // Remove a product from wishlist
  removeItem(productId) {
    return api.delete(`/wishlist/${productId}`);
  },

  // Move product from wishlist to cart
  moveToCart(productId, quantity = 1) {
    return api.post(`/wishlist/move-to-cart/${productId}`, { quantity });
  },

  // Clear entire wishlist
  clearWishlist() {
    return api.delete('/wishlist');
  },
};
