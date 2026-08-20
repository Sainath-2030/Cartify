import { AuthService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { user, token } = await AuthService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { user, token },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await AuthService.login(email, password);
  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: { user, token },
  });
});

// JWT auth is stateless: the server issues a signed token and does not
// keep session state. "Logout" simply means the client discards the
// token (and any persisted copy of it). This endpoint exists for a
// consistent API contract and future support for token blocklisting.
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard your access token on the client.',
  });
});
