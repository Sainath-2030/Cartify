import { Router } from 'express';
import {
  getProducts,
  searchProducts,
  getProductBySlug,
  getProductById,
  getBrands,
} from '../controllers/productController.js';

const router = Router();

// IMPORTANT: /search and /brands must be declared before /:id and
// /slug/:slug-style dynamic routes elsewhere so Express doesn't treat
// "search" or "brands" as a path parameter.
router.get('/search', searchProducts);
router.get('/brands', getBrands);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
router.get('/', getProducts);

export default router;
