import { api } from './api.js';
import { productService } from './productService.js';

export const categoryService = {
  list: () => api.get('/categories'),
  getBySlug: (slug) => api.get(`/categories/${encodeURIComponent(slug)}`),
  getProducts: (slug, params) =>
    api.get(`/categories/${encodeURIComponent(slug)}/products${productService.buildQueryString(params)}`),
};
