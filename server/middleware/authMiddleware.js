import { verifyToken } from '../utils/jwt.js';
import { AppError } from './errorMiddleware.js';

// Protects routes by requiring a valid JWT in the Authorization header:
//   Authorization: Bearer <token>
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    next(new AppError('Invalid or expired session. Please log in again.', 401));
  }
};
