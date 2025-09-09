import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import bcrypt from 'bcryptjs';

console.log('👤 Loading Admin Profile Routes...');

export const adminProfileRoutes = new Elysia({ prefix: '/admin' })
  
  // Get user profile
  .get('/profile', async ({ headers, set }) => {
    try {
      console.log('📋 GET /admin/profile - Get user profile');
      
      const authHeader = headers.authorization;
      if (!authHeader) {
        set.status = 401;
        return { error: 'Authorization header missing' };
      }

      const token = authHeader.replace('Bearer ', '');
      
      // Verify token and get user info
      const userResult = await sql`
        SELECT id, email, first_name, last_name, phone, address, role, created_at
        FROM users 
        WHERE id = (
          SELECT user_id FROM user_sessions 
          WHERE token = ${token} 
          AND expires_at > NOW()
          LIMIT 1
        )
      `;

      if (userResult.length === 0) {
        set.status = 401;
        return { error: 'Invalid or expired token' };
      }

      const user = userResult[0];
      
      return {
        success: true,
        profile: {
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          dateJoined: user.created_at
        }
      };
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Update user profile
  .put('/profile', async ({ body, headers, set }) => {
    try {
      console.log('💾 PUT /admin/profile - Update user profile');
      
      const authHeader = headers.authorization;
      if (!authHeader) {
        set.status = 401;
        return { error: 'Authorization header missing' };
      }

      const token = authHeader.replace('Bearer ', '');
      const { profile } = body;
      
      if (!profile) {
        set.status = 400;
        return { error: 'Profile data is required' };
      }

      // Verify token and get user ID
      const userResult = await sql`
        SELECT id FROM users 
        WHERE id = (
          SELECT user_id FROM user_sessions 
          WHERE token = ${token} 
          AND expires_at > NOW()
          LIMIT 1
        )
      `;

      if (userResult.length === 0) {
        set.status = 401;
        return { error: 'Invalid or expired token' };
      }

      const userId = userResult[0].id;
      
      // Update user profile
      await sql`
        UPDATE users 
        SET 
          first_name = ${profile.firstName},
          last_name = ${profile.lastName},
          email = ${profile.email},
          phone = ${profile.phone},
          address = ${profile.address},
          updated_at = NOW()
        WHERE id = ${userId}
      `;

      console.log('✅ Profile updated successfully for user:', userId);
      
      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Change password
  .post('/change-password', async ({ body, headers, set }) => {
    try {
      console.log('🔒 POST /admin/change-password - Change user password');
      
      const authHeader = headers.authorization;
      if (!authHeader) {
        set.status = 401;
        return { error: 'Authorization header missing' };
      }

      const token = authHeader.replace('Bearer ', '');
      const { currentPassword, newPassword } = body;
      
      if (!currentPassword || !newPassword) {
        set.status = 400;
        return { error: 'Current password and new password are required' };
      }

      if (newPassword.length < 6) {
        set.status = 400;
        return { error: 'New password must be at least 6 characters long' };
      }

      // Verify token and get user info
      const userResult = await sql`
        SELECT id, password FROM users 
        WHERE id = (
          SELECT user_id FROM user_sessions 
          WHERE token = ${token} 
          AND expires_at > NOW()
          LIMIT 1
        )
      `;

      if (userResult.length === 0) {
        set.status = 401;
        return { error: 'Invalid or expired token' };
      }

      const user = userResult[0];
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        set.status = 400;
        return { error: 'Current password is incorrect' };
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await sql`
        UPDATE users 
        SET 
          password = ${hashedNewPassword},
          updated_at = NOW()
        WHERE id = ${user.id}
      `;

      console.log('✅ Password changed successfully for user:', user.id);
      
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('❌ Error changing password:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });

console.log('✅ Admin Profile Routes loaded');
