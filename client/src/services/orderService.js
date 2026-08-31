import { api } from './api.js';

export const orderService = {
  // Returns server-side calculated preview for current cart
  async previewCheckout() {
    const res = await api.get('/orders/preview');
    return res.data;
  },

  // Places order via ACID transaction (server calculates prices & decrements stock)
  async createOrder({ shippingAddress, paymentMethod = 'PROTOTYPE_COD' }) {
    const res = await api.post('/orders', {
      shippingAddress,
      paymentMethod,
    });
    return res.data;
  },

  // Lists user order history
  async getUserOrders({ page = 1, limit = 10 } = {}) {
    const res = await api.get(`/orders?page=${page}&limit=${limit}`);
    return res.data;
  },

  // Retrieves order details by ID
  async getOrderById(orderId) {
    const res = await api.get(`/orders/${orderId}`);
    return res.data;
  },

  // Cancels pending order
  async cancelOrder(orderId) {
    const res = await api.patch(`/orders/${orderId}/cancel`);
    return res.data;
  },
};
