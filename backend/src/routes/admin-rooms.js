import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { authMiddleware, requireAdmin, requireStaff } from '../middleware/auth.js';
import 'dotenv/config';

// Admin Rooms API
export const adminRoomsRoutes = new Elysia({ prefix: '/admin/rooms' })
  // Get all rooms (Admin/Staff)
  .get('/', async ({ headers, set }) => {
    try {
      console.log('Admin rooms request received');
      
      // Authenticate staff or admin
      const user = await requireStaff({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      console.log('Authenticated user:', { id: user.id, role: user.role });

      const result = await sql`
        SELECT 
          rt.*,
          h.name as hotel_name,
          h.address as hotel_address
        FROM room_types rt
        JOIN hotels h ON rt.hotel_id = h.id
        ORDER BY rt.created_at DESC
      `;

      const rooms = result.map(room => ({
        id: room.id,
        name: room.name,
        type: room.name, // Use name as type since type column doesn't exist
        capacity: room.max_guests,
        price: parseFloat(room.price_per_night),
        description: room.description,
        amenities: room.amenities || [],
        image: room.image || (room.images && room.images[0]) || null,
        available: room.available,
        beds: room.beds || 1,
        size_sqm: room.size_sqm,
        hotel_name: room.hotel_name,
        hotel_address: room.hotel_address,
        created_at: room.created_at,
        updated_at: room.updated_at
      }));

      return { rooms };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Get single room (Admin)
  .get('/:id', async ({ params, headers, set }) => {
    try {
      console.log('Get single room request received for ID:', params.id);
      
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
          rt.*,
          h.name as hotel_name,
          h.address as hotel_address
        FROM room_types rt
        JOIN hotels h ON rt.hotel_id = h.id
        WHERE rt.id = ${params.id}
      `;

      if (result.length === 0) {
        set.status = 404;
        return { error: 'Room not found' };
      }

      const room = result[0];
      return {
        room: {
          id: room.id,
          name: room.name,
          type: room.name,
          capacity: room.max_guests,
          price: parseFloat(room.price_per_night),
          description: room.description,
          amenities: room.amenities || [],
          image: room.image || (room.images && room.images[0]) || null,
          available: room.available,
          beds: room.beds || 1,
          size_sqm: room.size_sqm,
          hotel_name: room.hotel_name,
          hotel_address: room.hotel_address,
          created_at: room.created_at,
          updated_at: room.updated_at
        }
      };
    } catch (error) {
      console.error('Error fetching room:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Create new room (Admin)
  .post('/', async ({ body, headers, set }) => {
    try {
      console.log('Create room request received');
      
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

      const { name, capacity, price, description, amenities, image, available, size_sqm } = body;

      // Validation
      if (!name || !capacity || !price) {
        set.status = 400;
        return { error: 'Missing required fields' };
      }

      // Get default hotel (assuming single hotel system)
      const hotelResult = await sql`SELECT id FROM hotels LIMIT 1`;
      if (hotelResult.length === 0) {
        set.status = 400;
        return { error: 'No hotel found' };
      }

      const hotelId = hotelResult[0].id;

      const result = await sql`
        INSERT INTO room_types (
          hotel_id, name, description, price_per_night, max_guests, 
          amenities, image, available, beds, size_sqm, created_at, updated_at
        ) VALUES (${hotelId}, ${name}, ${description}, ${price}, ${capacity}, ${amenities}, ${image}, ${available !== false}, ${1}, ${size_sqm || 25}, NOW(), NOW())
        RETURNING *
      `;

      const room = result[0];
      
      return {
        message: 'Room created successfully',
        room: {
          id: room.id,
          name: room.name,
          type: room.name,
          capacity: room.max_guests,
          price: parseFloat(room.price_per_night),
          description: room.description,
          amenities: room.amenities || [],
          image: room.image,
          available: room.available,
          beds: room.beds || 1,
          size_sqm: room.size_sqm,
          created_at: room.created_at,
          updated_at: room.updated_at
        }
      };
    } catch (error) {
      console.error('Error creating room:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Update room (Admin)
  .put('/:id', async ({ params, body, headers, set }) => {
    try {
      console.log('Update room request received for ID:', params.id);
      
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

      const { name, capacity, price, description, amenities, image, available, size_sqm } = body;

      // Validation
      if (!name || !capacity || !price) {
        set.status = 400;
        return { error: 'Missing required fields' };
      }

      // Check if room exists
      const checkResult = await sql`SELECT id FROM room_types WHERE id = ${params.id}`;
      if (checkResult.length === 0) {
        set.status = 404;
        return { error: 'Room not found' };
      }

      const result = await sql`
        UPDATE room_types 
        SET name = ${name}, description = ${description}, price_per_night = ${price}, max_guests = ${capacity}, 
            amenities = ${amenities}, image = ${image}, available = ${available}, size_sqm = ${size_sqm}, updated_at = NOW()
        WHERE id = ${params.id}
        RETURNING *
      `;

      const room = result[0];
      
      return {
        message: 'Room updated successfully',
        room: {
          id: room.id,
          name: room.name,
          type: room.name,
          capacity: room.max_guests,
          price: parseFloat(room.price_per_night),
          description: room.description,
          amenities: room.amenities || [],
          image: room.image,
          available: room.available,
          beds: room.beds || 1,
          size_sqm: room.size_sqm,
          created_at: room.created_at,
          updated_at: room.updated_at
        }
      };
    } catch (error) {
      console.error('Error updating room:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Delete room (Admin)
  .delete('/:id', async ({ params, headers, set }) => {
    try {
      console.log('Delete room request received for ID:', params.id);
      
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

      // Check if room exists
      const checkResult = await sql`SELECT id FROM room_types WHERE id = ${params.id}`;
      if (checkResult.length === 0) {
        set.status = 404;
        return { error: 'Room not found' };
      }

      // Check if room has active bookings
      const bookingsResult = await sql`
        SELECT id FROM bookings 
        WHERE room_type_id = ${params.id} AND status IN ('pending', 'confirmed')
      `;

      if (bookingsResult.length > 0) {
        set.status = 400;
        return { error: 'Cannot delete room with active bookings' };
      }

      // Delete room
      await sql`DELETE FROM room_types WHERE id = ${params.id}`;
      
      return { message: 'Room deleted successfully' };
    } catch (error) {
      console.error('Error deleting room:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Toggle room availability (Admin)
  .patch('/:id/toggle-availability', async ({ params, headers, set }) => {
    try {
      console.log('Toggle availability request received for ID:', params.id);
      
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

      // Check if room exists
      const checkResult = await sql`SELECT id, available FROM room_types WHERE id = ${params.id}`;
      if (checkResult.length === 0) {
        set.status = 404;
        return { error: 'Room not found' };
      }

      const currentAvailability = checkResult[0].available;
      const newAvailability = !currentAvailability;

      // Update availability
      const result = await sql`
        UPDATE room_types 
        SET available = ${newAvailability}, updated_at = NOW()
        WHERE id = ${params.id}
        RETURNING *
      `;

      const room = result[0];
      
      return {
        message: `Room ${newAvailability ? 'enabled' : 'disabled'} successfully`,
        room: {
          id: room.id,
          name: room.name,
          type: room.name,
          capacity: room.max_guests,
          price: parseFloat(room.price_per_night),
          description: room.description,
          amenities: room.amenities || [],
          image: room.image,
          available: room.available,
          beds: room.beds || 1,
          size_sqm: room.size_sqm,
          created_at: room.created_at,
          updated_at: room.updated_at
        }
      };
    } catch (error) {
      console.error('Error toggling room availability:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });

// Add separate room-types endpoint for calendar filtering
export const roomTypesRoutes = new Elysia({ prefix: '/admin/room-types' })
  // Get all room types (for filtering)
  .get('/', async ({ headers, set }) => {
    try {
      console.log('Room types request received');
      
      // Authenticate staff or admin
      const user = await requireStaff({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      console.log('Authenticated user:', { id: user.id, role: user.role });

      const result = await sql`
        SELECT DISTINCT 
          rt.name,
          rt.id,
          COUNT(*) as count
        FROM room_types rt
        JOIN hotels h ON rt.hotel_id = h.id
        WHERE rt.available = true
        GROUP BY rt.id, rt.name
        ORDER BY rt.name ASC
      `;

      const roomTypes = result.map(type => ({
        id: type.id,
        name: type.name,
        count: parseInt(type.count)
      }));

      return { roomTypes };
    } catch (error) {
      console.error('Error fetching room types:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });
