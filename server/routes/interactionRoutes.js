import { Router } from 'express';
import { recordInteraction } from '../controllers/interactionController.js';
import { optionalAuth } from '../middleware/optionalAuthMiddleware.js';

const router = Router();

router.post('/', optionalAuth, recordInteraction);

export default router;
