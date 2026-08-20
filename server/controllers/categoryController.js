import { CategoryService } from '../services/categoryService.js';
import { ProductService } from '../services/productService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseProductQuery } from '../validators/productValidators.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await CategoryService.listCategories();
  res.status(200).json({ success: true, data: categories });
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await CategoryService.getCategoryBySlug(req.params.slug);
  res.status(200).json({ success: true, data: category });
});

// GET /api/categories/:slug/products
export const getCategoryProducts = asyncHandler(async (req, res) => {
  const { valid, errors, filters, sort, page, limit } = parseProductQuery(req.query);
  if (!valid) throw new AppError('Invalid query parameters.', 422, errors);

  const { category, products, pagination } = await ProductService.listByCategory({
    categorySlug: req.params.slug,
    filters,
    sort,
    page,
    limit,
  });

  res.status(200).json({ success: true, data: products, pagination, category });
});
