import { Router } from 'express';
import { getMe, updateMe } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { validateProfileUpdate } from '../validators/userValidators.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, validateBody(validateProfileUpdate), updateMe);

export default router;
