import { api } from './api.js';

// Turns a filters/sort/page object into a query string, dropping any
// empty/undefined values so URLs stay clean (e.g. no "?brand=&rating=").
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

export const productService = {
  list: (params) => api.get(`/products${buildQueryString(params)}`),
  search: (params) => api.get(`/products/search${buildQueryString(params)}`),
  getBySlug: (slug) => api.get(`/products/slug/${encodeURIComponent(slug)}`),
  getBrands: (category) => api.get(`/products/brands${buildQueryString({ category })}`),
  buildQueryString,
};
