import { UserModel } from '../models/userModel.js';
import { AppError } from '../middleware/errorMiddleware.js';

export const UserService = {
  async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  },

  async updateProfile(userId, fields) {
    const camelToSnake = {
      fullName: 'full_name',
      mobile: 'mobile',
      address: 'address',
      city: 'city',
      state: 'state',
      postalCode: 'postal_code',
      dateOfBirth: 'date_of_birth',
      avatarUrl: 'avatar_url',
    };

    const snakeFields = {};
    for (const [camelKey, snakeKey] of Object.entries(camelToSnake)) {
      if (fields[camelKey] !== undefined) {
        snakeFields[snakeKey] = fields[camelKey];
      }
    }

    const updated = await UserModel.updateById(userId, snakeFields);
    if (!updated) {
      throw new AppError('User not found.', 404);
    }
    return updated;
  },
};
