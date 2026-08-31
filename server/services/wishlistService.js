import { WishlistModel } from '../models/wishlistModel.js';
import { ProductModel } from '../models/productModel.js';
import { CartService } from './cartService.js';
import { InteractionService } from './interactionService.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const WishlistService = {
  // Returns full wishlist details with count and products
  async getWishlist(userId) {
    const rawItems = await WishlistModel.findByUserId(userId);

    const items = rawItems.map((item) => ({
      id: item.wishlist_item_id,
      productId: item.product_id,
      name: item.name,
      slug: item.slug,
      brand: item.brand,
      price: parseFloat(item.price),
      finalPrice: parseFloat(item.final_price),
      discountPercentage: parseFloat(item.discount_percentage),
      rating: parseFloat(item.rating),
      reviewCount: item.review_count,
      stockQuantity: item.stock_quantity,
      mainImage: item.main_image,
      categoryName: item.category_name,
      categorySlug: item.category_slug,
      isActive: item.is_active,
      inStock: item.is_active && item.stock_quantity > 0,
      addedAt: item.added_at,
    }));

    return {
      items,
      totalItems: items.length,
    };
  },

  // Checks if a specific product is wishlisted by the user
  async checkItem(userId, productId) {
    return WishlistModel.isWishlisted(userId, productId);
  },

  // Adds product to user's wishlist
  async addItem({ userId, productId }) {
    const product = await ProductModel.findById(productId);
    if (!product || !product.is_active) {
      throw new AppError('Product not found or is unavailable.', 404);
    }

    const row = await WishlistModel.addItem({ userId, productId });
    // Emit telemetry only if row was actually created (not duplicate)
    if (row) {
      await InteractionService.recordTrusted({
        userId,
        productId,
        interactionType: 'WISHLIST_ADD',
      });
    }

    return this.getWishlist(userId);
  },

  // Removes product from user's wishlist
  async removeItem({ userId, productId }) {
    const removed = await WishlistModel.removeItem({ userId, productId });
    if (removed) {
      await InteractionService.recordTrusted({
        userId,
        productId,
        interactionType: 'WISHLIST_REMOVE',
      });
    }
    return this.getWishlist(userId);
  },

  // Moves product from wishlist into cart
  async moveToCart({ userId, productId, quantity = 1 }) {
    // Add to cart first (verifies product existence & stock)
    const cart = await CartService.addItem({ userId, productId, quantity });
    // If successfully added to cart, remove from wishlist
    await WishlistModel.removeItem({ userId, productId });
    const wishlist = await this.getWishlist(userId);

    return {
      wishlist,
      cart,
    };
  },

  // Returns array of wishlisted product IDs
  async getWishlistIds(userId) {
    return WishlistModel.getWishlistProductIds(userId);
  },

  // Clears user's wishlist
  async clearWishlist(userId) {
    await WishlistModel.clearWishlist(userId);
    return {
      items: [],
      totalItems: 0,
    };
  },
};
