import { Router } from 'express';
import {
  getProductReviews,
  getProductReviewSummary,
  submitReview,
  updateReview,
  getMyReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public review discovery endpoints
router.get('/products/:productId/reviews/summary', getProductReviewSummary);
router.get('/products/:productId/reviews', getProductReviews);

// Authenticated user review mutation endpoints
router.get('/products/:productId/reviews/me', requireAuth, getMyReview);
router.post('/products/:productId/reviews', requireAuth, submitReview);
router.patch('/reviews/:reviewId', requireAuth, updateReview);
router.put('/reviews/:reviewId', requireAuth, updateReview);
router.delete('/reviews/:reviewId', requireAuth, deleteReview);

export default router;
