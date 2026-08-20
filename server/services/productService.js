import { ProductModel } from '../models/productModel.js';
import { ReviewModel } from '../models/reviewModel.js';
import { CategoryModel } from '../models/categoryModel.js';
import { AppError } from '../middleware/errorMiddleware.js';

const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

export const ProductService = {
  async listProducts({ filters, sort, page, limit }) {
    const { rows, total } = await ProductModel.list({ filters, sort, page, limit });
    return { products: rows, pagination: buildPagination(page, limit, total) };
  },

  async searchProducts({ filters, sort, page, limit }) {
    if (!filters.q) {
      throw new AppError('A search query (q) is required.', 422, { q: 'Please enter a search term.' });
    }
    const { rows, total } = await ProductModel.list({ filters, sort, page, limit });
    return { products: rows, pagination: buildPagination(page, limit, total), query: filters.q };
  },

  async getProductBySlug(slug) {
    const product = await ProductModel.findBySlug(slug);
    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const [reviews, ratingBreakdown, related] = await Promise.all([
      ReviewModel.findByProduct(product.id, 10),
      ReviewModel.ratingBreakdown(product.id),
      ProductModel.findRelated(product.category_id, product.id, 4),
    ]);

    return { ...product, reviews, ratingBreakdown, relatedProducts: related };
  },

  async getProductById(id) {
    const product = await ProductModel.findById(id);
    if (!product) {
      throw new AppError('Product not found.', 404);
    }
    return product;
  },

  async listBrands(categorySlug) {
    return ProductModel.listBrands(categorySlug);
  },

  async listByCategory({ categorySlug, filters, sort, page, limit }) {
    const category = await CategoryModel.findBySlug(categorySlug);
    if (!category) {
      throw new AppError('Category not found.', 404);
    }
    const { rows, total } = await ProductModel.listByCategory({ categorySlug, filters, sort, page, limit });
    return { category, products: rows, pagination: buildPagination(page, limit, total) };
  },
};
