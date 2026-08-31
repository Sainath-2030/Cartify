import { Router } from 'express';
import {
  getWishlist,
  getWishlistIds,
  checkWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  clearWishlist,
} from '../controllers/wishlistController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All wishlist endpoints require authenticated user session
router.use(requireAuth);

router.get('/ids', getWishlistIds);
router.get('/check/:productId', checkWishlist);
router.get('/', getWishlist);

router.post('/', addToWishlist);
router.post('/items', addToWishlist);
router.post('/move-to-cart/:productId', moveToCart);

router.delete('/items/:productId', removeFromWishlist);
router.delete('/:productId', removeFromWishlist);
router.delete('/', clearWishlist);

export default router;
