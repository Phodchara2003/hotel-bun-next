import { Elysia } from 'elysia';
import { db, parseRow } from '../../db/sqlite.js';
import { hashPassword, comparePassword, generateToken } from '../../utils/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/register', async ({ body, set }) => {
    try {
      const { email, password, firstName, lastName, phone } = body;
      
      if (!email || !password || !firstName || !lastName) {
        set.status = 400;
        return { error: 'Missing required fields' };
      }
      
      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      
      if (existingUser) {
        set.status = 400;
        return { error: 'User already exists with this email' };
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const insertQuery = `
        INSERT INTO users (email, password, first_name, last_name, phone, role)
        VALUES (?, ?, ?, ?, ?, 'user')
      `;
      
      const result = db.prepare(insertQuery).run(email, hashedPassword, firstName, lastName, phone || null);
      
      // Get the created user
      const newUser = db.prepare('SELECT id, email, first_name, last_name, role FROM users WHERE id = ?').get(result.lastInsertRowid);
      
      // Generate JWT token
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        process.env.JWT_SECRET || 'hotel_booking_jwt_secret_2025_very_secure_key_12345',
        { expiresIn: '7d' }
      );
      
      return {
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  .post('/login', async ({ body, set }) => {
    try {
      const { email, password } = body;

      if (!email || !password) {
        set.status = 400;
        return { error: 'Email and password are required' };
      }

      // Find user by email
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      if (!user) {
        set.status = 401;
        return { error: 'Invalid email or password' };
      }

      // Compare password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        set.status = 401;
        return { error: 'Invalid email or password' };
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'hotel_booking_jwt_secret_2025_very_secure_key_12345',
        { expiresIn: '7d' }
      );

      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role || 'user'
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  .get('/me', async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { error: 'No token provided' };
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hotel_booking_jwt_secret_2025_very_secure_key_12345');

      // Get user from database
      const user = db.prepare('SELECT id, email, first_name, last_name, role FROM users WHERE id = ?').get(decoded.id);

      if (!user) {
        set.status = 401;
        return { error: 'User not found' };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role || 'user'
        }
      };
    } catch (error) {
      console.error('Auth me error:', error);
      set.status = 401;
      return { error: 'Invalid or expired token' };
    }
  })

  .post('/logout', async ({ set }) => {
    // For JWT, logout is handled client-side by removing the token
    return {
      success: true,
      message: 'Logged out successfully'
    };
  });
