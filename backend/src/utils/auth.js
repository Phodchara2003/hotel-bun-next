import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const hashPassword = async (password) => {
  return await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 12 });
};

export const comparePassword = async (password, hash) => {
  return await Bun.password.verify(password, hash);
};

const JWT_SECRET = process.env.JWT_SECRET || 'hotel_booking_jwt_secret_2025_very_secure_key_12345';

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
};

export const generateBookingReference = () => {
  const prefix = 'HTL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};
