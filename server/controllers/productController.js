import { ProductService } from '../services/productService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parseProductQuery } from '../validators/productValidators.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { valid, errors, filters, sort, page, limit } = parseProductQuery(req.query);
  if (!valid) throw new AppError('Invalid query parameters.', 422, errors);

  const { products, pagination } = await ProductService.listProducts({ filters, sort, page, limit });
  res.status(200).json({ success: true, data: products, pagination });
});

export const searchProducts = asyncHandler(async (req, res) => {
  const { valid, errors, filters, sort, page, limit } = parseProductQuery(req.query);
  if (!valid) throw new AppError('Invalid query parameters.', 422, errors);

  const { products, pagination, query: q } = await ProductService.searchProducts({ filters, sort, page, limit });
  res.status(200).json({ success: true, data: products, pagination, query: q });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await ProductService.getProductBySlug(req.params.slug);
  res.status(200).json({ success: true, data: product });
});

export const getProductById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) {
    throw new AppError('Invalid product id.', 400);
  }
  const product = await ProductService.getProductById(id);
  res.status(200).json({ success: true, data: product });
});

export const getBrands = asyncHandler(async (req, res) => {
  const brands = await ProductService.listBrands(req.query.category);
  res.status(200).json({ success: true, data: brands });
});
