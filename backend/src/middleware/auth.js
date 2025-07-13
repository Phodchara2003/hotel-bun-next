import { verifyToken } from '../utils/auth.js';
import { sql } from '../db/database.js';
import 'dotenv/config';

export const authMiddleware = async ({ headers, set }) => {
  console.log('=== AUTH MIDDLEWARE START ===');
  console.log('Headers received:', Object.keys(headers));
  
  // TEMPORARY: Return hardcoded user for testing
  console.log('BYPASSING AUTH - RETURNING HARDCODED ADMIN');
  return { id: 1, email: 'admin@example.com', first_name: 'Admin', last_name: 'User', role: 'admin' };
  
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
