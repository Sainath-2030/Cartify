import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { getMe } from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validateMiddleware.js';
import { validateRegister, validateLogin } from '../validators/authValidators.js';

const router = Router();

router.post('/register', validateBody(validateRegister), register);
router.post('/login', validateBody(validateLogin), login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);

export default router;
