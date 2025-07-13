import { Elysia } from 'elysia';
import { bearer } from '@elysiajs/bearer';
import postgres from 'postgres';
import { t } from 'elysia';

// Create database connection
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// Admin Rooms API
export const adminRoomsRoutes = new Elysia()
  .use(bearer())
  .guard({
    beforeHandle: async ({ bearer, set }) => {
      if (!bearer) {
        set.status = 401;
        return { error: 'Token required' };
      }

      try {
        const jwt = new (await import('@elysiajs/jwt')).jwt({
          name: 'jwt',
          secret: process.env.JWT_SECRET || 'your-secret-key'
        });

        const payload = await jwt.verify(bearer);
        if (!payload) {
          set.status = 401;
          return { error: 'Invalid token' };
        }

        // Check if user is admin
        const user = await sql`SELECT * FROM users WHERE id = ${payload.userId}`;
        if (!user[0] || user[0].role !== 'admin') {
          set.status = 403;
          return { error: 'Admin access required' };
        }

        return { user: user[0] };
      } catch (error) {
        console.error('Auth error:', error);
        set.status = 401;
        return { error: 'Invalid token' };
      }
    }
  })
  // Get all rooms (Admin)
  .get('/api/admin/rooms', async ({ set }) => {
    try {
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
  .get('/api/admin/rooms/:id', async ({ params, set }) => {
    try {
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
  .post('/api/admin/rooms', async ({ body, set }) => {
    try {
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
  }, {
    body: t.Object({
      name: t.String(),
      capacity: t.Number(),
      price: t.Number(),
      description: t.Optional(t.String()),
      amenities: t.Optional(t.Array(t.String())),
      image: t.Optional(t.String()),
      available: t.Optional(t.Boolean()),
      size_sqm: t.Optional(t.Number())
    })
  })
  
  // Update room (Admin)
  .put('/api/admin/rooms/:id', async ({ params, body, set }) => {
    try {
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
  }, {
    body: t.Object({
      name: t.String(),
      capacity: t.Number(),
      price: t.Number(),
      description: t.Optional(t.String()),
      amenities: t.Optional(t.Array(t.String())),
      image: t.Optional(t.String()),
      available: t.Optional(t.Boolean()),
      size_sqm: t.Optional(t.Number())
    })
  })
  
  // Delete room (Admin)
  .delete('/api/admin/rooms/:id', async ({ params, set }) => {
    try {
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
  .patch('/api/admin/rooms/:id/toggle-availability', async ({ params, set }) => {
    try {
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
