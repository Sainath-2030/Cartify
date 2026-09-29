import { api } from './api.js';

function buildQueryString(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      usp.set(key, value);
    }
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export const contentManagerService = {
  // Products
  listProducts: (params = {}) => api.get(`/content-manager/products${buildQueryString(params)}`),
  createProduct: (productData) => api.post('/content-manager/products', productData),
  updateProduct: (id, fields) => api.patch(`/content-manager/products/${id}`, fields),
  updateProductImages: (id, { mainImage, images }) =>
    api.patch(`/content-manager/products/${id}/images`, { mainImage, images }),

  // Categories
  listCategories: () => api.get('/content-manager/categories'),
  createCategory: (categoryData) => api.post('/content-manager/categories', categoryData),
  updateCategory: (id, categoryData) => api.patch(`/content-manager/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/content-manager/categories/${id}`),

  // Public product detail
  getProductById: (id) => api.get(`/products/${id}`),
};
