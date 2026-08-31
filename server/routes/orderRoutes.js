import { Router } from 'express';
import {
  previewCheckout,
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All order endpoints require an authenticated user
router.use(requireAuth);

router.get('/preview', previewCheckout);
router.get('/', getUserOrders);
router.post('/', createOrder);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/cancel', cancelOrder);

export default router;
