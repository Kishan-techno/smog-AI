import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { AppError } from '../middleware/errorHandler.js';
import { signToken } from '../middleware/auth.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password, preferredCity, preferredLanguage } = req.body;
      const existing = await userRepository.findByEmail(email);
      if (existing) {
        throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await userRepository.create({
        name,
        email,
        passwordHash,
        preferredCity,
        preferredLanguage,
      });
      const token = signToken(user);
      res.status(201).json({ token, user });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const userDoc = await userRepository.findByEmail(email);
      if (!userDoc) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }
      const ok = await bcrypt.compare(password, userDoc.passwordHash);
      if (!ok) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
      }
      const { passwordHash: _removed, ...user } = userDoc;
      const token = signToken(user);
      res.json({ token, user });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await userRepository.findById(req.user.sub);
      if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User account not found');
      }
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },
};
