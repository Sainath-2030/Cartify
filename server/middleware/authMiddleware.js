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
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role || 'USER' };
    next();
  } catch (err) {
    next(new AppError('Invalid or expired session. Please log in again.', 401));
  }
};

// Restricts a route to one or more roles. Must run AFTER requireAuth, since
// it depends on req.user being populated from a verified JWT — this is the
// real (server-side) authorization boundary per SRS SEC-3. Client-side role
// checks (RoleProtectedRoute) are a UX convenience only and must never be
// trusted as the sole access control.
//
// Usage: router.get('/admin/x', requireAuth, requireRole('ADMIN'), handler)
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};