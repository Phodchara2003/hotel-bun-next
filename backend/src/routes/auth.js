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
  })

  .put('/profile', async ({ headers, body, set }) => {
    try {
      // Authenticate user
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const { firstName, lastName, phone } = body;

      if (!firstName || !lastName) {
        set.status = 400;
        return { 
          success: false, 
          message: 'กรุณากรอกชื่อและนามสกุล' 
        };
      }

      // Update user profile
      const updatedUser = await sql`
        UPDATE users 
        SET first_name = ${firstName}, 
            last_name = ${lastName}, 
            phone = ${phone || null},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user.id}
        RETURNING id, email, first_name, last_name, phone, role, updated_at
      `;

      if (updatedUser.length === 0) {
        set.status = 404;
        return { 
          success: false, 
          message: 'ไม่พบผู้ใช้' 
        };
      }

      const updated = updatedUser[0];

      return {
        success: true,
        message: 'อัพเดทข้อมูลสำเร็จ',
        user: {
          id: updated.id,
          email: updated.email,
          firstName: updated.first_name,
          lastName: updated.last_name,
          phone: updated.phone,
          role: updated.role,
          updatedAt: updated.updated_at
        }
      };

    } catch (error) {
      console.error('Profile update error:', error);
      set.status = 500;
      return { 
        success: false, 
        message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' 
      };
    }
  })

  .put('/change-password', async ({ headers, body, set }) => {
    try {
      // Authenticate user
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const { currentPassword, newPassword, confirmPassword } = body;

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        set.status = 400;
        return { 
          success: false, 
          message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
        };
      }

      if (newPassword !== confirmPassword) {
        set.status = 400;
        return { 
          success: false, 
          message: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน' 
        };
      }

      if (newPassword.length < 6) {
        set.status = 400;
        return { 
          success: false, 
          message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' 
        };
      }

      // Get current user password
      const userWithPassword = await sql`
        SELECT password FROM users WHERE id = ${user.id}
      `;

      if (!userWithPassword.length) {
        set.status = 404;
        return { 
          success: false, 
          message: 'ไม่พบผู้ใช้' 
        };
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, userWithPassword[0].password);
      
      if (!isValidPassword) {
        set.status = 400;
        return { 
          success: false, 
          message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' 
        };
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update password
      const updatedUser = await sql`
        UPDATE users 
        SET password = ${hashedNewPassword}, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${user.id}
        RETURNING id, email, first_name, last_name
      `;

      if (updatedUser.length === 0) {
        set.status = 500;
        return { 
          success: false, 
          message: 'ไม่สามารถอัพเดทรหัสผ่านได้' 
        };
      }

      return {
        success: true,
        message: 'เปลี่ยนรหัสผ่านสำเร็จ',
        user: {
          id: updatedUser[0].id,
          email: updatedUser[0].email,
          firstName: updatedUser[0].first_name,
          lastName: updatedUser[0].last_name
        }
      };

    } catch (error) {
      console.error('Change password error:', error);
      set.status = 500;
      return { 
        success: false, 
        message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' 
      };
    }
  });
