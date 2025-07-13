import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = (payload) => {
  const secret = 'hotel_booking_jwt_secret_2025_very_secure_key_12345';
  console.log('Generating token with secret:', secret);
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    const secret = 'hotel_booking_jwt_secret_2025_very_secure_key_12345';
    console.log('Verifying token with secret:', secret);
    const result = jwt.verify(token, secret);
    console.log('Token verification successful:', result);
    return result;
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
