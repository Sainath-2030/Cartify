import { api } from './api.js';

export const cartService = {
  // Get current authenticated user's cart
  getCart() {
    return api.get('/cart');
  },

  // Add an item to the cart
  addItem(productId, quantity = 1) {
    return api.post('/cart', { productId, quantity });
  },

  // Update quantity of a product in the cart
  updateQuantity(productId, quantity) {
    return api.put(`/cart/${productId}`, { quantity });
  },

  // Remove a product from the cart
  removeItem(productId) {
    return api.delete(`/cart/${productId}`);
  },

  // Clear the entire cart
  clearCart() {
    return api.delete('/cart');
  },
};
