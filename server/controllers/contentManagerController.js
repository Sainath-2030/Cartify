import { ContentManagerService } from '../services/contentManagerService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateUpdateImages,
  validateCategory,
} from '../validators/contentManagerValidators.js';
import { AppError } from '../middleware/errorMiddleware.js';

// GET /api/content-manager/products
export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const { category, isActive, search, sort } = req.query;

  const result = await ContentManagerService.listProducts({
    page,
    limit,
    category,
    isActive,
    search,
    sort,
  });

  res.status(200).json({
    success: true,
    data: result.products,
    pagination: result.pagination,
  });
});

// POST /api/content-manager/products
export const createProduct = asyncHandler(async (req, res) => {
  const { valid, errors, data } = validateCreateProduct(req.body);
  if (!valid) {
    throw new AppError('Invalid product data.', 422, errors);
  }

  const product = await ContentManagerService.createProduct({
    user: req.user,
    productData: data,
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully.',
    data: product,
  });
});

// PATCH /api/content-manager/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const { valid, errors, fields } = validateUpdateProduct(req.body);
  if (!valid) {
    throw new AppError('Invalid update payload.', 422, errors);
  }

  if (Object.keys(fields).length === 0) {
    throw new AppError('No valid fields provided for update.', 422);
  }

  const updated = await ContentManagerService.updateProduct({
    user: req.user,
    id,
    updateData: fields,
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully.',
    data: updated,
  });
});

// PATCH /api/content-manager/products/:id/images
export const updateProductImages = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AppError('Invalid product ID.', 400);
  }

  const { valid, errors, data } = validateUpdateImages(req.body);
  if (!valid) {
    throw new AppError('Invalid images payload.', 422, errors);
  }

  const updated = await ContentManagerService.updateProductImages({
    user: req.user,
    id,
    mainImage: data.mainImage,
    images: data.images,
  });

  res.status(200).json({
    success: true,
    message: 'Product images updated successfully.',
    data: updated,
  });
});

// GET /api/content-manager/categories
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await ContentManagerService.listCategories();
  res.status(200).json({ success: true, data: categories });
});

// POST /api/content-manager/categories
export const createCategory = asyncHandler(async (req, res) => {
  const { valid, errors, data } = validateCategory(req.body);
  if (!valid) {
    throw new AppError('Invalid category payload.', 422, errors);
  }

  const category = await ContentManagerService.createCategory({
    user: req.user,
    categoryData: data,
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully.',
    data: category,
  });
});

// PATCH /api/content-manager/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AppError('Invalid category ID.', 400);
  }

  const { valid, errors, data } = validateCategory(req.body);
  if (!valid) {
    throw new AppError('Invalid category update payload.', 422, errors);
  }

  const updated = await ContentManagerService.updateCategory({
    user: req.user,
    id,
    categoryData: data,
  });

  res.status(200).json({
    success: true,
    message: 'Category updated successfully.',
    data: updated,
  });
});

// DELETE /api/content-manager/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AppError('Invalid category ID.', 400);
  }

  const deleted = await ContentManagerService.deleteCategory({
    user: req.user,
    id,
  });

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully.',
    data: deleted,
  });
});
