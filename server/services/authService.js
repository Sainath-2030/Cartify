import bcrypt from 'bcrypt';
import { UserModel } from '../models/userModel.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorMiddleware.js';

const SALT_ROUNDS = 10;

export const AuthService = {
  async register(data) {
    const existingByEmail = await UserModel.findByEmail(data.email.trim().toLowerCase());
    if (existingByEmail) {
      throw new AppError('An account with this email already exists.', 409, {
        email: 'This email is already registered.',
      });
    }

    const existingByMobile = await UserModel.findByMobile(data.mobile.trim());
    if (existingByMobile) {
      throw new AppError('An account with this mobile number already exists.', 409, {
        mobile: 'This mobile number is already registered.',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await UserModel.create({
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      passwordHash,
      mobile: data.mobile.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      state: data.state.trim(),
      postalCode: data.postalCode.trim(),
      dateOfBirth: data.dateOfBirth || null,
    });

      const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { user, token };
  },

  async login(email, password) {
    const user = await UserModel.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    // Strip password_hash before returning.
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  },
};
