import { ContentManagerModel } from '../models/contentManagerModel.js';
import { ProductModel } from '../models/productModel.js';
import { CategoryModel } from '../models/categoryModel.js';
import { AuditModel } from '../models/auditModel.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const ContentManagerService = {
  // Lists products for content management console
  async listProducts({ page = 1, limit = 20, category = null, isActive = null, search = null, sort = 'created_desc' }) {
    const result = await ContentManagerModel.listProducts({ page, limit, category, isActive, search, sort });
    return {
      products: result.products.map((p) => ({
        id: parseInt(p.id, 10),
        source: p.source,
        sourceId: p.source_id,
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        categoryId: parseInt(p.category_id, 10),
        categoryName: p.category_name,
        categorySlug: p.category_slug,
        subcategory: p.subcategory,
        price: parseFloat(p.price),
        discountPercentage: parseFloat(p.discount_percentage),
        finalPrice: parseFloat(p.final_price),
        rating: p.rating !== null ? parseFloat(p.rating) : null,
        reviewCount: parseInt(p.review_count, 10),
        stockQuantity: parseInt(p.stock_quantity, 10),
        sellerName: p.seller_name,
        mainImage: p.main_image,
        isActive: p.is_active,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / limit)),
      },
    };
  },

  // Creates an internal product with source='internal'
  async createProduct({ user, productData }) {
    const category = await CategoryModel.findById(productData.categoryId);
    if (!category) {
      throw new AppError('Category does not exist.', 404);
    }

    // Generate unique slug
    const baseSlug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    const uniqueSuffix = Date.now().toString(36);
    const slug = `${baseSlug}-${uniqueSuffix}`;
    const sourceId = `INT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const created = await ContentManagerModel.createProduct({
      ...productData,
      source: 'internal',
      sourceId,
      slug,
    });

    await AuditModel.record({
      userId: user.id,
      action: 'PRODUCT_CREATE',
      entityType: 'product',
      entityId: created.id,
      metadata: { name: created.name, sourceId, categoryId: productData.categoryId },
    });

    return {
      id: parseInt(created.id, 10),
      source: created.source,
      sourceId: created.source_id,
      name: created.name,
      slug: created.slug,
      brand: created.brand,
      categoryId: parseInt(created.category_id, 10),
      price: parseFloat(created.price),
      discountPercentage: parseFloat(created.discount_percentage),
      finalPrice: parseFloat(created.final_price),
      stockQuantity: parseInt(created.stock_quantity, 10),
      mainImage: created.main_image,
      isActive: created.is_active,
      createdAt: created.created_at,
    };
  },

  // Updates product metadata
  async updateProduct({ user, id, updateData }) {
    const existing = await ContentManagerModel.findById(id);
    if (!existing) {
      throw new AppError('Product not found.', 404);
    }

    if (updateData.category_id) {
      const category = await CategoryModel.findById(updateData.category_id);
      if (!category) {
        throw new AppError('Category does not exist.', 404);
      }
    }

    const updated = await ContentManagerModel.updateProduct(id, updateData);

    await AuditModel.record({
      userId: user.id,
      action: 'PRODUCT_UPDATE',
      entityType: 'product',
      entityId: id,
      metadata: { modifiedFields: Object.keys(updateData) },
    });

    return {
      id: parseInt(updated.id, 10),
      source: updated.source,
      sourceId: updated.source_id,
      name: updated.name,
      slug: updated.slug,
      brand: updated.brand,
      categoryId: parseInt(updated.category_id, 10),
      price: parseFloat(updated.price),
      discountPercentage: parseFloat(updated.discount_percentage),
      finalPrice: parseFloat(updated.final_price),
      stockQuantity: parseInt(updated.stock_quantity, 10),
      mainImage: updated.main_image,
      isActive: updated.is_active,
      updatedAt: updated.updated_at,
    };
  },

  // Updates product images
  async updateProductImages({ user, id, mainImage, images }) {
    const existing = await ContentManagerModel.findById(id);
    if (!existing) {
      throw new AppError('Product not found.', 404);
    }

    const updated = await ContentManagerModel.updateImages(id, { mainImage, images });

    await AuditModel.record({
      userId: user.id,
      action: 'PRODUCT_IMAGES_UPDATE',
      entityType: 'product',
      entityId: id,
      metadata: { mainImage, additionalImagesCount: images.length },
    });

    return {
      id: parseInt(updated.id, 10),
      name: updated.name,
      mainImage: updated.main_image,
      images: typeof updated.images === 'string' ? JSON.parse(updated.images) : updated.images,
      updatedAt: updated.updated_at,
    };
  },

  // Lists all categories
  async listCategories() {
    return CategoryModel.findAll();
  },

  // Creates a category
  async createCategory({ user, categoryData }) {
    const existing = await CategoryModel.findBySlug(categoryData.slug);
    if (existing) {
      throw new AppError('A category with this slug already exists.', 409);
    }

    const created = await ContentManagerModel.createCategory(categoryData);

    await AuditModel.record({
      userId: user.id,
      action: 'CATEGORY_CREATE',
      entityType: 'category',
      entityId: created.id,
      metadata: { name: created.name, slug: created.slug },
    });

    return created;
  },

  // Updates a category
  async updateCategory({ user, id, categoryData }) {
    const existing = await CategoryModel.findById(id);
    if (!existing) {
      throw new AppError('Category not found.', 404);
    }

    const updated = await ContentManagerModel.updateCategory(id, categoryData);

    await AuditModel.record({
      userId: user.id,
      action: 'CATEGORY_UPDATE',
      entityType: 'category',
      entityId: id,
      metadata: { name: updated.name },
    });

    return updated;
  },

  // Deletes category safely (rejects if products depend on it)
  async deleteCategory({ user, id }) {
    const existing = await CategoryModel.findById(id);
    if (!existing) {
      throw new AppError('Category not found.', 404);
    }

    const productCount = await ContentManagerModel.countProductsInCategory(id);
    if (productCount > 0) {
      throw new AppError(
        `Cannot delete category "${existing.name}". ${productCount} product(s) currently belong to this category.`,
        422,
        { dependency: `Reassign or remove ${productCount} products before deleting this category.` }
      );
    }

    const deleted = await ContentManagerModel.deleteCategory(id);

    await AuditModel.record({
      userId: user.id,
      action: 'CATEGORY_DELETE',
      entityType: 'category',
      entityId: id,
      metadata: { name: existing.name, slug: existing.slug },
    });

    return deleted;
  },
};
