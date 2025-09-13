import { verifyToken } from '../utils/auth.js';
import { sql } from '../db/database.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const authMiddleware = async ({ headers, set, request }) => {
  const authHeader = headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { error: 'Access token required' };
  }
  
  const token = authHeader.substring(7);
  
  try {
    const secret = process.env.JWT_SECRET || 'hotel_booking_jwt_secret_2025_very_secure_key_12345';
    const decoded = jwt.verify(token, secret);
    
    // Use token-based authentication only (database quota exceeded)
    const fallbackUser = {
      id: decoded.id,
      email: decoded.email,
      first_name: decoded.email === 'admin@hotel.com' ? 'Admin' : 'User',
      last_name: decoded.email === 'admin@hotel.com' ? 'User' : 'Test',
      role: decoded.role
    };
    
    return fallbackUser;
    
  } catch (error) {
    set.status = 401;
    return { error: 'Invalid or expired token' };
  }
};

// Check if user has admin privileges
export const requireAdmin = async ({ headers, set }) => {
  const user = await authMiddleware({ headers, set });
  
  if (user.error) {
    return user;
  }
  
  if (user.role !== 'admin') {
    set.status = 403;
    return { error: 'Admin access required' };
  }
  
  return user;
};

// Check if user has staff or admin privileges
export const requireStaff = async ({ headers, set }) => {
  const user = await authMiddleware({ headers, set });
  
  if (user.error) {
    return user;
  }
  
  if (!['staff', 'admin', 'super_admin'].includes(user.role)) {
    set.status = 403;
    return { error: 'Staff or admin access required' };
  }
  
  return user;
};
