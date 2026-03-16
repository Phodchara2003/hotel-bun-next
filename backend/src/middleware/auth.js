import { verifyToken } from '../utils/auth.js';
import { sql } from '../db/database.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'hotel_booking_jwt_secret_2025_very_secure_key_12345';

export const authMiddleware = async ({ headers, set }) => {
  const authHeader = headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    set.status = 401;
    return { error: 'Access token required' };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch real user data from database
    try {
      const users = await sql`
        SELECT id, email, first_name, last_name, role
        FROM users WHERE id = ${decoded.id}
      `;
      if (users.length > 0) return users[0];
    } catch (_dbErr) {
      // DB unavailable — fall back to token claims only
    }

    // Fallback: use only what is in the token
    return {
      id: decoded.id,
      email: decoded.email,
      first_name: decoded.first_name || '',
      last_name: decoded.last_name || '',
      role: decoded.role
    };

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

  if (!['admin', 'super_admin'].includes(user.role)) {
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

  if (!['staff', 'admin', 'super_admin', 'manager'].includes(user.role)) {
    set.status = 403;
    return { error: 'Staff or admin access required' };
  }

  return user;
};
