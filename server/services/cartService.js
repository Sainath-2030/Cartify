import { CartModel } from '../models/cartModel.js';
import { ProductModel } from '../models/productModel.js';
import { InteractionService } from './interactionService.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const CartService = {
  // Calculates summary totals and item line prices for the cart
  async getCart(userId) {
    const rawItems = await CartModel.findByUserId(userId);

    let subtotal = 0;
    let totalItems = 0;

    const items = rawItems.map((item) => {
      const unitPrice = parseFloat(item.final_price);
      const originalPrice = parseFloat(item.price);
      const qty = parseInt(item.quantity, 10);
      const itemSubtotal = Math.round(unitPrice * qty * 100) / 100;
      const isAvailable = item.is_active && item.stock_quantity > 0;
      const isQuantityExceeded = qty > item.stock_quantity;

      subtotal += itemSubtotal;
      totalItems += qty;

      return {
        id: item.cart_item_id,
        productId: item.product_id,
        name: item.name,
        slug: item.slug,
        brand: item.brand,
        price: originalPrice,
        finalPrice: unitPrice,
        discountPercentage: parseFloat(item.discount_percentage),
        quantity: qty,
        stockQuantity: item.stock_quantity,
        itemSubtotal,
        mainImage: item.main_image,
        categoryName: item.category_name,
        categorySlug: item.category_slug,
        isAvailable,
        isQuantityExceeded,
        addedAt: item.added_at,
        updatedAt: item.updated_at,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;

    return {
      items,
      itemCount: items.length,
      totalItems,
      subtotal,
      currency: 'INR',
    };
  },

  // Adds a product to user's cart with inventory and active state checks
  async addItem({ userId, productId, quantity = 1 }) {
    const product = await ProductModel.findById(productId);
    if (!product || !product.is_active) {
      throw new AppError('Product not found or is currently unavailable.', 404);
    }

    if (product.stock_quantity <= 0) {
      throw new AppError(`"${product.name}" is currently out of stock.`, 422, {
        stock: 'Out of stock',
      });
    }

    const existingItem = await CartModel.findItem(userId, productId);
    const existingQty = existingItem ? parseInt(existingItem.quantity, 10) : 0;
    const requestedTotalQty = existingQty + quantity;

    if (requestedTotalQty > product.stock_quantity) {
      const allowedAdd = Math.max(0, product.stock_quantity - existingQty);
      if (allowedAdd <= 0) {
        throw new AppError(
          `You already have the maximum available stock (${product.stock_quantity} units) of "${product.name}" in your cart.`,
          422,
          { stock: `Only ${product.stock_quantity} units in stock.` }
        );
      }
      throw new AppError(
        `Cannot add ${quantity} more units. Only ${allowedAdd} additional unit(s) available in stock for "${product.name}".`,
        422,
        { stock: `Max available to add: ${allowedAdd}` }
      );
    }

    await CartModel.addItem({ userId, productId, quantity });

    // Record CART_ADD telemetry event
    await InteractionService.recordTrusted({
      userId,
      productId,
      interactionType: 'CART_ADD',
      metadata: { quantity },
    });

    return this.getCart(userId);
  },

  // Updates quantity of an existing cart item
  async updateQuantity({ userId, productId, quantity }) {
    if (quantity <= 0) {
      return this.removeItem({ userId, productId });
    }

    const product = await ProductModel.findById(productId);
    if (!product || !product.is_active) {
      // If product no longer exists or inactive, remove from cart
      await CartModel.removeItem({ userId, productId });
      throw new AppError('Product is no longer available and was removed from your cart.', 404);
    }

    if (quantity > product.stock_quantity) {
      throw new AppError(
        `Cannot set quantity to ${quantity}. Only ${product.stock_quantity} unit(s) available in stock.`,
        422,
        { stock: `Max stock: ${product.stock_quantity}` }
      );
    }

    const updated = await CartModel.updateQuantity({ userId, productId, quantity });
    if (!updated) {
      throw new AppError('Item not found in your cart.', 404);
    }

    return this.getCart(userId);
  },

  // Removes item from cart
  async removeItem({ userId, productId }) {
    await CartModel.removeItem({ userId, productId });

    // Record CART_REMOVE telemetry event
    await InteractionService.recordTrusted({
      userId,
      productId,
      interactionType: 'CART_REMOVE',
    });

    return this.getCart(userId);
  },

  // Clears user's cart
  async clearCart(userId) {
    await CartModel.clearCart(userId);
    return {
      items: [],
      itemCount: 0,
      totalItems: 0,
      subtotal: 0,
      currency: 'INR',
    };
  },
};
