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
    if (!slug || slug === 'undefined') {
      throw new AppError('Product not found.', 404);
    }
    let product = await ProductModel.findBySlug(slug);
    if (!product && /^\d+$/.test(slug)) {
      product = await ProductModel.findById(parseInt(slug, 10));
    }
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
    const [reviews, ratingBreakdown, related] = await Promise.all([
      ReviewModel.findByProduct(product.id, 10),
      ReviewModel.ratingBreakdown(product.id),
      ProductModel.findRelated(product.category_id, product.id, 4),
    ]);
    return { ...product, reviews, ratingBreakdown, relatedProducts: related };
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

  async getVisuallySimilarProducts(productId, limit = 6) {
    const { AdminService } = await import('./adminService.js');
    const res = await AdminService.getCnnVisualSimilarities({ productId, topK: limit });
    return {
      source: 'cnn_resnet18',
      productId,
      similarProducts: res.similarProducts || [],
    };
  },

  async getForYouRecommendations({ userId = null, sessionId = null, topK = 8 }) {
    if (userId) {
      const { UserService } = await import('./userService.js');
      const recs = await UserService.getRecommendations(userId, topK);
      return {
        success: true,
        source: 'attention_fusion',
        user: userId,
        recommendations: recs,
      };
    }

    if (sessionId) {
      const { AdminService } = await import('./adminService.js');
      const gruRes = await AdminService.getGruRecommendations({ sessionId, topK });
      if (gruRes && gruRes.recommendations && gruRes.recommendations.length > 0) {
        return {
          success: true,
          source: 'gru_session',
          session: sessionId,
          recommendations: gruRes.recommendations,
        };
      }
    }

    // Default cold-start / general storefront fallback
    const { rows } = await ProductModel.list({ filters: {}, sort: 'popular', page: 1, limit: topK });
    return {
      success: true,
      source: 'trending_fallback',
      recommendations: (rows || []).map((p, idx) => ({
        rank: idx + 1,
        productId: parseInt(p.id, 10),
        slug: p.slug,
        score: 0.85 - idx * 0.04,
        affinityPercentage: Math.round((0.85 - idx * 0.04) * 100),
        name: p.name,
        category: p.category_name || 'General',
        price: parseFloat(p.price) || 0,
        finalPrice: parseFloat(p.final_price || p.price) || 0,
        mainImage: p.main_image,
        brand: p.brand || 'Cartify',
        rating: parseFloat(p.rating) || 4.5,
        categoryId: p.category_id,
        dominantModality: 'TRENDING',
      })),
    };
  },
};
