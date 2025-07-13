import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { hashPassword } from '../utils/auth.js';
import 'dotenv/config';

// Admin Users API
export const adminUsersRoutes = new Elysia({ prefix: '/admin/users' })
  // Get all users (Admin)
  .get('/', async ({ headers, query, set }) => {
    try {
      console.log('Admin users request received');
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      console.log('Authenticated user:', { id: user.id, role: user.role });
      
      if (user.role !== 'admin') {
        console.log('Access denied: user is not admin');
        set.status = 403;
        return { error: 'Admin access required' };
      }

      const { page = 1, limit = 50, role, search } = query;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let params = [];

      if (role) {
        whereConditions.push(`role = $${params.length + 1}`);
        params.push(role);
      }

      if (search) {
        whereConditions.push(`(email ILIKE $${params.length + 1} OR first_name ILIKE $${params.length + 2} OR last_name ILIKE $${params.length + 3})`);
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const result = await sql.unsafe(`
        SELECT 
          id, email, first_name, last_name, phone, role, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);

      // Get total count
      const countResult = await sql.unsafe(`
        SELECT COUNT(*) as total FROM users ${whereClause}
      `, params);

      const total = parseInt(countResult[0].total);

      const users = result.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }));

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Get single user (Admin)
  .get('/:id', async ({ params, headers, set }) => {
    try {
      console.log('Get single user request received for ID:', params.id);
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      if (user.role !== 'admin') {
        console.log('Access denied: user is not admin');
        set.status = 403;
        return { error: 'Admin access required' };
      }

      const result = await sql`
        SELECT 
          id, email, first_name, last_name, phone, role, created_at, updated_at
        FROM users
        WHERE id = ${params.id}
      `;

      if (result.length === 0) {
        set.status = 404;
        return { error: 'User not found' };
      }

      const userData = result[0];

      // Get user's booking statistics
      const bookingStats = await sql`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN total_price ELSE 0 END), 0) as total_spent
        FROM bookings
        WHERE user_id = ${params.id}
      `;

      return {
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          fullName: `${userData.first_name} ${userData.last_name}`,
          phone: userData.phone,
          role: userData.role,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
          stats: {
            totalBookings: parseInt(bookingStats[0].total_bookings),
            completedBookings: parseInt(bookingStats[0].completed_bookings),
            cancelledBookings: parseInt(bookingStats[0].cancelled_bookings),
            totalSpent: parseFloat(bookingStats[0].total_spent)
          }
        }
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Create new user (Admin)
  .post('/', async ({ body, headers, set }) => {
    try {
      console.log('Create user request received');
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      if (user.role !== 'admin') {
        console.log('Access denied: user is not admin');
        set.status = 403;
        return { error: 'Admin access required' };
      }

      const { email, password, firstName, lastName, phone, role = 'user' } = body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        set.status = 400;
        return { error: 'Missing required fields' };
      }

      // Check if user already exists
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email}
      `;

      if (existingUser.length > 0) {
        set.status = 400;
        return { error: 'User with this email already exists' };
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      const result = await sql`
        INSERT INTO users (
          email, password, first_name, last_name, phone, role, created_at, updated_at
        ) VALUES (${email}, ${hashedPassword}, ${firstName}, ${lastName}, ${phone}, ${role}, NOW(), NOW())
        RETURNING id, email, first_name, last_name, phone, role, created_at, updated_at
      `;

      const newUser = result[0];
      
      return {
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          fullName: `${newUser.first_name} ${newUser.last_name}`,
          phone: newUser.phone,
          role: newUser.role,
          createdAt: newUser.created_at,
          updatedAt: newUser.updated_at
        }
      };
    } catch (error) {
      console.error('Error creating user:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Update user (Admin)
  .put('/:id', async ({ params, body, headers, set }) => {
    try {
      console.log('Update user request received for ID:', params.id);
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      if (user.role !== 'admin') {
        console.log('Access denied: user is not admin');
        set.status = 403;
        return { error: 'Admin access required' };
      }

      const { email, firstName, lastName, phone, role, password } = body;

      // Validation
      if (!email || !firstName || !lastName) {
        set.status = 400;
        return { error: 'Missing required fields' };
      }

      // Check if user exists
      const checkResult = await sql`SELECT id FROM users WHERE id = ${params.id}`;
      if (checkResult.length === 0) {
        set.status = 404;
        return { error: 'User not found' };
      }

      // Check if email is already taken by another user
      const emailCheck = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${params.id}
      `;

      if (emailCheck.length > 0) {
        set.status = 400;
        return { error: 'Email is already taken by another user' };
      }

      let updateFields = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        updated_at: new Date()
      };

      // If password is provided, hash it
      if (password) {
        updateFields.password = await hashPassword(password);
      }

      const result = await sql`
        UPDATE users 
        SET ${sql(updateFields)}
        WHERE id = ${params.id}
        RETURNING id, email, first_name, last_name, phone, role, created_at, updated_at
      `;

      const updatedUser = result[0];
      
      return {
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          fullName: `${updatedUser.first_name} ${updatedUser.last_name}`,
          phone: updatedUser.phone,
          role: updatedUser.role,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        }
      };
    } catch (error) {
      console.error('Error updating user:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Delete user (Admin)
  .delete('/:id', async ({ params, headers, set }) => {
    try {
      console.log('Delete user request received for ID:', params.id);
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      if (user.role !== 'admin') {
        console.log('Access denied: user is not admin');
        set.status = 403;
        return { error: 'Admin access required' };
      }

      // Check if user exists
      const checkResult = await sql`SELECT id, role FROM users WHERE id = ${params.id}`;
      if (checkResult.length === 0) {
        set.status = 404;
        return { error: 'User not found' };
      }

      // Prevent deleting the current admin user
      if (parseInt(params.id) === user.id) {
        set.status = 400;
        return { error: 'Cannot delete your own account' };
      }

      // Check if user has active bookings
      const bookingsResult = await sql`
        SELECT id FROM bookings 
        WHERE user_id = ${params.id} AND status IN ('pending', 'confirmed')
      `;

      if (bookingsResult.length > 0) {
        set.status = 400;
        return { error: 'Cannot delete user with active bookings' };
      }

      // Delete user
      await sql`DELETE FROM users WHERE id = ${params.id}`;
      
      return { message: 'User deleted successfully' };
    } catch (error) {
      console.error('Error deleting user:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Toggle user role (Admin)
  .patch('/:id/toggle-role', async ({ params, headers, set }) => {
    try {
      console.log('Toggle user role request received for ID:', params.id);
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      if (user.role !== 'admin') {
        console.log('Access denied: user is not admin');
        set.status = 403;
        return { error: 'Admin access required' };
      }

      // Check if user exists
      const checkResult = await sql`SELECT id, role FROM users WHERE id = ${params.id}`;
      if (checkResult.length === 0) {
        set.status = 404;
        return { error: 'User not found' };
      }

      // Prevent changing own role
      if (parseInt(params.id) === user.id) {
        set.status = 400;
        return { error: 'Cannot change your own role' };
      }

      const currentRole = checkResult[0].role;
      const newRole = currentRole === 'admin' ? 'user' : 'admin';

      // Update role
      const result = await sql`
        UPDATE users 
        SET role = ${newRole}, updated_at = NOW()
        WHERE id = ${params.id}
        RETURNING id, email, first_name, last_name, phone, role, created_at, updated_at
      `;

      const updatedUser = result[0];
      
      return {
        message: `User role changed to ${newRole} successfully`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          fullName: `${updatedUser.first_name} ${updatedUser.last_name}`,
          phone: updatedUser.phone,
          role: updatedUser.role,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        }
      };
    } catch (error) {
      console.error('Error toggling user role:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Get user's bookings (Admin)
  .get('/:id/bookings', async ({ params, headers, query, set }) => {
    try {
      console.log('Get user bookings request received for ID:', params.id);
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      if (user.role !== 'admin') {
        console.log('Access denied: user is not admin');
        set.status = 403;
        return { error: 'Admin access required' };
      }

      const { page = 1, limit = 10 } = query;
      const offset = (page - 1) * limit;

      const bookings = await sql`
        SELECT 
          b.*,
          h.name as hotel_name,
          rt.name as room_type_name
        FROM bookings b
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        WHERE b.user_id = ${params.id}
        ORDER BY b.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const countResult = await sql`
        SELECT COUNT(*) as total FROM bookings WHERE user_id = ${params.id}
      `;

      const total = parseInt(countResult[0].total);

      return {
        bookings: bookings.map(booking => ({
          id: booking.id,
          bookingReference: booking.booking_reference,
          hotelName: booking.hotel_name || 'N/A',
          roomTypeName: booking.room_type_name || 'N/A',
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          guests: booking.guests,
          totalPrice: parseFloat(booking.total_price),
          status: booking.status,
          createdAt: booking.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });
