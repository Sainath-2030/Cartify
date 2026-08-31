import { Router } from 'express';
import {
  listProducts,
  createProduct,
  updateProduct,
  updateProductImages,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/contentManagerController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// All content manager endpoints allow CONTENT_MANAGER or ADMIN
router.use(requireAuth, requireRole('CONTENT_MANAGER', 'ADMIN'));

router.get('/products', listProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.patch('/products/:id/images', updateProductImages);

router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
