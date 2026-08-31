import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All cart endpoints require an authenticated user session
router.use(requireAuth);

router.get('/', getCart);
router.post('/', addToCart);
router.post('/items', addToCart);
router.put('/:productId', updateCartItem);
router.patch('/:productId', updateCartItem);
router.put('/items/:productId', updateCartItem);
router.patch('/items/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.delete('/items/:productId', removeFromCart);
router.delete('/', clearCart);

export default router;
