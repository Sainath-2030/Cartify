import { verifyToken } from '../utils/jwt.js';

// Like requireAuth, but never blocks the request. Used on routes that
// should work for guests AND logged-in users, while still letting us
// attach req.user when a valid token is present (e.g. to record
// interactions against the right user_id).
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme === 'Bearer' && token) {
    try {
      const decoded = verifyToken(token);
      req.user = { id: decoded.userId, email: decoded.email };
    } catch {
      // Invalid/expired token on an optional-auth route — just proceed as a guest.
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};
