import { UserService } from '../services/userService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await UserService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: { user } });
});

export const updateMe = asyncHandler(async (req, res) => {
  const updated = await UserService.updateProfile(req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: { user: updated },
  });
});

export const getRecommendations = asyncHandler(async (req, res) => {
  const topK = parseInt(req.query.topK, 10) || 6;
  const recommendations = await UserService.getRecommendations(req.user.id, topK);
  res.status(200).json({
    success: true,
    data: { recommendations },
  });
});

