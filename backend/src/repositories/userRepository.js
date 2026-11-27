import crypto from 'node:crypto';
import { UserModel } from './models.js';
import { isDbConnected } from '../config/db.js';

const fallbackUsers = new Map();

export const userRepository = {
  async findByEmail(email) {
    const normalized = email.toLowerCase();
    if (!isDbConnected()) {
      for (const u of fallbackUsers.values()) {
        if (u.email === normalized) return u;
      }
      return null;
    }
    return UserModel.findOne({ email: normalized }).lean();
  },

  async findById(id) {
    if (!isDbConnected()) {
      const u = fallbackUsers.get(String(id));
      if (!u) return null;
      const { passwordHash: _removed, ...safe } = u;
      return safe;
    }
    return UserModel.findById(id).select('-passwordHash').lean();
  },

  async create({ name, email, passwordHash, preferredCity = 'bhopal', preferredLanguage = 'en' }) {
    const normalized = email.toLowerCase();
    if (!isDbConnected()) {
      const record = {
        _id: crypto.randomUUID(),
        name,
        email: normalized,
        passwordHash,
        preferredCity,
        preferredLanguage,
        createdAt: new Date().toISOString(),
      };
      fallbackUsers.set(record._id, record);
      const { passwordHash: _removed, ...safe } = record;
      return safe;
    }
    const user = await UserModel.create({
      name,
      email: normalized,
      passwordHash,
      preferredCity,
      preferredLanguage,
    });
    const obj = user.toObject();
    delete obj.passwordHash;
    return obj;
  },
};
