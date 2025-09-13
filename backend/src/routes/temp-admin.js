// Temporary API endpoint to update user role to admin
import { Elysia } from 'elysia';
import { db } from '../db/sqlite.js';

export const tempAdminRoutes = new Elysia({ prefix: '/temp' })
  .get('/make-admin/:email', async ({ params, set }) => {
    try {
      const { email } = params;
      
      console.log(`🔍 Looking for user with email: ${email}`);
      
      // Check if user exists
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      
      if (!user) {
        set.status = 404;
        return { error: 'User not found' };
      }
      
      console.log('👤 Found user:', {
        id: user.id,
        email: user.email,
        role: user.role,
        name: `${user.first_name} ${user.last_name}`
      });
      
      if (user.role === 'admin') {
        return {
          message: 'User already has admin role',
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            name: `${user.first_name} ${user.last_name}`
          }
        };
      }
      
      // Update user role to admin
      console.log('🔄 Updating user role to admin...');
      const updateStmt = db.prepare('UPDATE users SET role = ? WHERE email = ?');
      const result = updateStmt.run('admin', email);
      
      if (result.changes > 0) {
        console.log('✅ User role updated to admin successfully!');
        
        // Get updated user
        const updatedUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        
        return {
          message: 'User role updated to admin successfully',
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            name: `${updatedUser.first_name} ${updatedUser.last_name}`
          }
        };
      } else {
        set.status = 500;
        return { error: 'Failed to update user role' };
      }
      
    } catch (error) {
      console.error('❌ Error updating user role:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .get('/users', async ({ set }) => {
    try {
      // List all users
      const users = db.prepare('SELECT id, email, first_name, last_name, role, created_at FROM users').all();
      
      return {
        message: 'Users retrieved successfully',
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          createdAt: user.created_at
        }))
      };
    } catch (error) {
      console.error('❌ Error getting users:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });