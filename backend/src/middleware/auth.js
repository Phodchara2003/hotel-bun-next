import { verifyToken } from '../utils/auth.js';
import { sql } from '../db/database.js';
import 'dotenv/config';

export const authMiddleware = async ({ headers, set, request }) => {
  console.log('=== AUTH MIDDLEWARE START ===');
  
  const authHeader = headers.authorization;
  console.log('Authorization header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No auth header or invalid format');
    set.status = 401;
    return { error: 'Access token required' };
  }
  
  const token = authHeader.substring(7);
  console.log('Token extracted:', token ? 'Token present' : 'No token');
  
  // Use jwt.verify directly with the same secret used in generation
  try {
    const jwt = require('jsonwebtoken');
    const secret = 'hotel_booking_jwt_secret_2025_very_secure_key_12345';
    console.log('Verifying token with secret:', secret);
    
    const decoded = jwt.verify(token, secret);
    console.log('Token verification successful:', decoded);
    
    // Get user from database
    const user = await sql`
      SELECT id, email, first_name, last_name, role 
      FROM users 
      WHERE id = ${decoded.id}
    `;
    
    console.log('User query result:', user);
    
    if (!user.length) {
      console.log('User not found in database');
      set.status = 401;
      return { error: 'User not found' };
    }
    
    console.log('Auth successful for user:', user[0].email);
    return user[0];
    
  } catch (error) {
    console.error('Token verification error:', error.message);
    set.status = 401;
    return { error: 'Invalid or expired token' };
  }
};

// Check if user has admin privileges
export const requireAdmin = async ({ headers, set }) => {
  const user = await authMiddleware({ headers, set });
  if (user.error) return user;
  
  if (user.role !== 'admin') {
    set.status = 403;
    return { error: 'Admin access required' };
  }
  
  return user;
};

// Check if user has staff or admin privileges (read-only access)
export const requireStaff = async ({ headers, set }) => {
  const user = await authMiddleware({ headers, set });
  if (user.error) return user;
  
  if (!['staff', 'admin'].includes(user.role)) {
    set.status = 403;
    return { error: 'Staff or admin access required' };
  }
  
  return user;
};
