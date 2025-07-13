import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js';
import { registerSchema, loginSchema } from '../schemas/validation.js';
import { authMiddleware } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post('/register', async ({ body, set }) => {
    try {
      const validatedData = registerSchema.parse(body);
      
      // Check if user already exists
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${validatedData.email}
      `;
      
      if (existingUser.length > 0) {
        set.status = 400;
        return { error: 'User already exists with this email' };
      }
      
      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create user
      const newUser = await sql`
        INSERT INTO users (email, password, first_name, last_name, phone)
        VALUES (${validatedData.email}, ${hashedPassword}, ${validatedData.firstName}, 
                ${validatedData.lastName}, ${validatedData.phone || null})
        RETURNING id, email, first_name, last_name, role, created_at
      `;
      
      const user = newUser[0];
      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      
      return {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          createdAt: user.created_at
        },
        token
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        set.status = 400;
        return { error: 'Validation failed', details: error.errors };
      }
      console.error('Registration error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .post('/login', async ({ body, set }) => {
    try {
      const validatedData = loginSchema.parse(body);
      
      // Find user
      const user = await sql`
        SELECT id, email, password, first_name, last_name, role
        FROM users 
        WHERE email = ${validatedData.email}
      `;
      
      if (!user.length) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }
      
      // Verify password
      const isValidPassword = await comparePassword(validatedData.password, user[0].password);
      
      if (!isValidPassword) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }
      
      const userData = user[0];
      const token = generateToken({ 
        id: userData.id, 
        email: userData.email, 
        role: userData.role 
      });
      
      return {
        message: 'Login successful',
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role
        },
        token
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        set.status = 400;
        return { error: 'Validation failed', details: error.errors };
      }
      console.error('Login error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .get('/validate', async ({ headers, set }) => {
    try {
      // Authenticate user
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;
      
      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Token validation error:', error);
      set.status = 401;
      return { error: 'Invalid token' };
    }
  });
