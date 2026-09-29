import { Router } from 'express';
import {
  getProducts,
  searchProducts,
  getProductBySlug,
  getProductById,
  getBrands,
  getSimilarProducts,
  getForYouRecommendations,
} from '../controllers/productController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// IMPORTANT: /search, /brands, and /recommendations must be declared before
// /:id and /slug/:slug-style dynamic routes elsewhere so Express doesn't treat
// them as a path parameter.
router.get('/search', searchProducts);
router.get('/brands', getBrands);
router.get('/recommendations/for-you', optionalAuth, getForYouRecommendations);
router.get('/:id/similar', getSimilarProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);
router.get('/', getProducts);

export default router;
