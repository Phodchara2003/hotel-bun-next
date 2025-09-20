import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../utils/auth.js';
import { authMiddleware } from '../middleware/auth.js';

console.log('👤 Loading Unified Profile Routes...');

// Removed legacy getUserByToken helper (session + JWT fallback) after unifying auth via authMiddleware.

export const profileRoutes = new Elysia()
  .get('/profile', async ({ headers, set }) => {
    try {
  console.log('➡️  [GET /profile] handler start');
  // Log authorization header presence only (not full token for security)
  const authHeaderPreview = headers?.authorization ? headers.authorization.split(' ')[0] + ' ****' : 'none';
  console.log('   auth header:', authHeaderPreview);
      const authUser = await authMiddleware({ headers, set });
      if (authUser?.error) return authUser;
  console.log('   authUser resolved:', authUser);

      // fetch extended fields (phone, address, national_id, password hash) if not already present
  console.log('   querying users table for id', authUser.id);
  const rows = await sql`SELECT id, email, first_name, last_name, phone, address, national_id, username, role, password, created_at FROM users WHERE id = ${authUser.id}`;
  console.log('   query result length:', rows?.length);
      const user = rows[0];
      if (!user) { set.status = 401; return { error: 'Invalid or expired token' }; }
      return {
        success: true,
        profile: {
          firstName: user.first_name || '',
          lastName: user.last_name || '',
            email: user.email,
          phone: user.phone || '',
          address: user.address || '',
          nationalId: user.national_id || '',
          username: user.username || user.email,
          dateJoined: user.created_at,
          role: user.role
        }
      };
    } catch (e) {
  console.error('❌ GET /profile error:', e?.message, e?.stack);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .patch('/profile', async ({ headers, body, set }) => {
    try {
      const authUser = await authMiddleware({ headers, set });
      if (authUser?.error) return authUser;

      // Support both body.profile and direct body formats
      const profile = body?.profile ? body.profile : body;
      const allowed = ['first_name', 'last_name', 'email', 'phone', 'address', 'national_id', 'username'];
      const hasField = allowed.some(k => profile[k] !== undefined);
      if (!hasField) { set.status = 400; return { error: 'No valid fields to update' }; }

      const updated = {
        first_name: profile.first_name ?? authUser.first_name,
        last_name: profile.last_name ?? authUser.last_name,
        email: profile.email ?? authUser.email,
        phone: profile.phone ?? authUser.phone,
        address: profile.address ?? authUser.address,
        national_id: profile.national_id ?? authUser.national_id,
        username: profile.username ?? authUser.username
      };

      await sql`UPDATE users SET 
        first_name = ${updated.first_name}, 
        last_name = ${updated.last_name}, 
        email = ${updated.email}, 
        phone = ${updated.phone}, 
        address = ${updated.address}, 
        national_id = ${updated.national_id},
        username = ${updated.username}, 
        updated_at = NOW() 
        WHERE id = ${authUser.id}`;

      return { success: true, profile: {
        firstName: updated.first_name,
        lastName: updated.last_name,
        email: updated.email,
        phone: updated.phone || '',
        address: updated.address || '',
        nationalId: updated.national_id || '',
        username: updated.username || '',
        dateJoined: authUser.created_at,
        role: authUser.role
      }};
    } catch (e) {
      console.error('❌ PATCH /profile error', e);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .put('/profile', async ({ headers, body, set }) => {
    try {
      console.log('➡️  [PUT /profile] handler start');
      const authUser = await authMiddleware({ headers, set });
      if (authUser?.error) return authUser;

      // Support both body.profile and direct body formats
      const profile = body?.profile ? body.profile : body;
      console.log('PUT /profile received data:', profile);
      
      // Support both camelCase and snake_case field names
      const firstName = profile.firstName || profile.first_name;
      const lastName = profile.lastName || profile.last_name;
      const phone = profile.phone;
      const address = profile.address || profile.bio; // Support bio as address
      const nationalId = profile.nationalId || profile.national_id;
      const username = profile.username;
      
      const hasField = firstName !== undefined || lastName !== undefined || phone !== undefined || address !== undefined || nationalId !== undefined || username !== undefined;
      if (!hasField) { set.status = 400; return { error: 'No valid fields to update' }; }

      const updated = {
        first_name: firstName ?? authUser.first_name,
        last_name: lastName ?? authUser.last_name,
        email: authUser.email, // Email ไม่ให้เปลี่ยน
        phone: phone ?? authUser.phone,
        address: address ?? authUser.address,
        national_id: nationalId ?? authUser.national_id,
        username: username ?? authUser.username
      };
      
      console.log('Updating user with data:', updated);

      await sql`UPDATE users SET 
        first_name = ${updated.first_name}, 
        last_name = ${updated.last_name}, 
        email = ${updated.email}, 
        phone = ${updated.phone}, 
        address = ${updated.address}, 
        national_id = ${updated.national_id},
        username = ${updated.username}, 
        updated_at = NOW() 
        WHERE id = ${authUser.id}`;

      const result = { success: true, profile: {
        firstName: updated.first_name,
        lastName: updated.last_name,
        email: updated.email,
        phone: updated.phone || '',
        address: updated.address || '',
        nationalId: updated.national_id || '',
        bio: updated.address || '', // ส่ง address เป็น bio ด้วย
        username: updated.username || '',
        dateJoined: authUser.created_at,
        role: authUser.role
      }};
      
      console.log('Returning updated profile:', result);
      return result;
    } catch (error) {
      console.error('PUT /profile error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .post('/profile/password', async ({ headers, body, set }) => {
    try {
      const authUser = await authMiddleware({ headers, set });
      if (authUser?.error) return authUser;

      const { currentPassword, newPassword } = body || {};
      if (!currentPassword || !newPassword) { set.status = 400; return { error: 'currentPassword and newPassword required' }; }
      if (newPassword.length < 6) { set.status = 400; return { error: 'New password must be at least 6 characters' }; }

      // Need password hash; fetch it
      const rows = await sql`SELECT password FROM users WHERE id = ${authUser.id}`;
      const hash = rows[0]?.password;
      if (!hash) { set.status = 500; return { error: 'Password record missing' }; }

      const valid = await bcrypt.compare(currentPassword, hash);
      if (!valid) { set.status = 400; return { error: 'Current password incorrect' }; }

      const hashed = await bcrypt.hash(newPassword, 12);
      await sql`UPDATE users SET password = ${hashed}, updated_at = NOW() WHERE id = ${authUser.id}`;
      return { success: true, message: 'Password changed successfully' };
    } catch (e) {
      console.error('❌ POST /profile/password error', e);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });

console.log('✅ Unified Profile Routes loaded');
