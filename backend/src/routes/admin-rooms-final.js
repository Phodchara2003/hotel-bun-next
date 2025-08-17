import { Elysia } from 'elysia';
import postgres from 'postgres';
import { t } from 'elysia';
import { authMiddleware } from '../middleware/auth.js';

// Create database connection
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// Admin Rooms API
export const adminRoomsRoutes = new Elysia()
  // Get all rooms (Admin)
  .get('/', async ({ headers, set }) => {
    try {
      // Manual auth check
      const user = await authMiddleware({ headers, set });
      if (!user || user.error) {
        return user || { error: 'Authentication required' };
      }

      // Check if user is admin
      if (user.role !== 'admin') {
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
        ORDER BY rt.created_at DESC
      `;

      const rooms = result.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type || room.name, // ใช้ type จากฐานข้อมูล หรือ fallback เป็น name
        capacity: room.max_guests,
        price: parseFloat(room.price_per_night),
        description: room.description,
        amenities: room.amenities || [],
        image: room.image || (room.images && room.images[0]) || null,
        images: room.images || [], // Include the full images array
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
      // Manual auth check
      const user = await authMiddleware({ headers, set });
      if (!user || user.error) {
        return user || { error: 'Authentication required' };
      }

      // Check if user is admin
      if (user.role !== 'admin') {
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
          type: room.type || room.name, // ใช้ type จากฐานข้อมูล หรือ fallback เป็น name
          capacity: room.max_guests,
          price: parseFloat(room.price_per_night),
          description: room.description,
          amenities: room.amenities || [],
          image: room.image || (room.images && room.images[0]) || null,
          images: room.images || [], // Include the full images array
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
      console.log('🏨 Creating new room - Body received:', JSON.stringify(body, null, 2));
      
      // Manual auth check
      const user = await authMiddleware({ headers, set });
      if (!user || user.error) {
        return user || { error: 'Authentication required' };
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        set.status = 403;
        return { error: 'Admin access required' };
      }
      
      const { name, type, capacity, price, description, amenities, image, images, available, size_sqm } = body;

      // Enhanced validation with detailed error messages
      const errors = [];
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        errors.push('Room name is required and must be a non-empty string');
      }
      
      if (!type || typeof type !== 'string' || type.trim() === '') {
        errors.push('Room type is required and must be a non-empty string');
      }
      
      if (!capacity || typeof capacity !== 'number' || capacity < 1) {
        errors.push('Capacity must be a positive number');
      }
      
      if (!price || typeof price !== 'number' || price <= 0) {
        errors.push('Price must be a positive number');
      }

      if (errors.length > 0) {
        console.log('❌ Validation errors:', errors);
        set.status = 422;
        return { 
          error: 'Validation failed', 
          details: errors,
          received_data: body
        };
      }

      // Get default hotel (assuming single hotel system)
      const hotelResult = await sql`SELECT id FROM hotels LIMIT 1`;
      if (hotelResult.length === 0) {
        set.status = 400;
        return { error: 'No hotel found' };
      }

      const hotelId = hotelResult[0].id;

      // Use images array if provided, otherwise fallback to single image
      const finalImages = images && images.length > 0 ? images : (image ? [image] : []);
      
      // Clean and prepare data
      const cleanedData = {
        hotel_id: hotelId,
        name: name.trim(),
        type: type.trim(),
        description: description || '',
        price_per_night: parseFloat(price),
        max_guests: parseInt(capacity),
        amenities: Array.isArray(amenities) ? amenities : [],
        images: finalImages,
        available: available !== false,
        beds: 1,
        size_sqm: size_sqm ? parseInt(size_sqm) : 25
      };

      console.log('✅ Cleaned data for insertion:', JSON.stringify(cleanedData, null, 2));

      const result = await sql`
        INSERT INTO room_types (
          hotel_id, name, type, description, price_per_night, max_guests, 
          amenities, images, available, beds, size_sqm, created_at, updated_at
        ) VALUES (
          ${cleanedData.hotel_id}, 
          ${cleanedData.name}, 
          ${cleanedData.type}, 
          ${cleanedData.description}, 
          ${cleanedData.price_per_night}, 
          ${cleanedData.max_guests}, 
          ${cleanedData.amenities}, 
          ${cleanedData.images}, 
          ${cleanedData.available}, 
          ${cleanedData.beds}, 
          ${cleanedData.size_sqm}, 
          NOW(), 
          NOW()
        )
        RETURNING *
      `;

      const room = result[0];
      
      console.log('🎉 Room created successfully:', room.id);
      
      return {
        message: 'Room created successfully',
        room: {
          id: room.id,
          name: room.name,
          type: room.type, // ใช้ type จากฐานข้อมูล
          capacity: room.max_guests,
          price: parseFloat(room.price_per_night),
          description: room.description,
          amenities: room.amenities || [],
          image: room.images && room.images[0] || null, // First image for backward compatibility
          images: room.images || [], // Full images array
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
      type: t.String(), // เพิ่มฟิลด์ type
      capacity: t.Number(),
      price: t.Number(),
      description: t.Optional(t.String()),
      amenities: t.Optional(t.Array(t.String())),
      image: t.Optional(t.String()),
      images: t.Optional(t.Array(t.String())),
      available: t.Optional(t.Boolean()),
      size_sqm: t.Optional(t.Number())
    })
  })

  // Update room (Admin)
  .put('/:id', async ({ params, body, headers, set }) => {
    try {
      // Manual auth check
      const user = await authMiddleware({ headers, set });
      if (!user || user.error) {
        return user || { error: 'Authentication required' };
      }

      // Check if user is admin
      if (user.role !== 'admin') {
        set.status = 403;
        return { error: 'Admin access required' };
      }
      
      const { name, type, capacity, price, description, amenities, image, images, available, size_sqm } = body;

      // Validation
      if (!name || !type || !capacity || !price) {
        set.status = 400;
        return { error: 'Missing required fields' };
      }

      // Check if room exists
      const checkResult = await sql`SELECT id FROM room_types WHERE id = ${params.id}`;
      if (checkResult.length === 0) {
        set.status = 404;
        return { error: 'Room not found' };
      }

      // Use images array if provided, otherwise fallback to single image
      const finalImages = images && images.length > 0 ? images : (image ? [image] : []);

      const result = await sql`
        UPDATE room_types 
        SET name = ${name}, type = ${type}, description = ${description}, price_per_night = ${price}, max_guests = ${capacity}, 
            amenities = ${amenities}, images = ${finalImages}, available = ${available}, size_sqm = ${size_sqm}, updated_at = NOW()
        WHERE id = ${params.id}
        RETURNING *
      `;

      const room = result[0];
      
      return {
        message: 'Room updated successfully',
        room: {
          id: room.id,
          name: room.name,
          type: room.type, // ใช้ type จากฐานข้อมูล
          capacity: room.max_guests,
          price: parseFloat(room.price_per_night),
          description: room.description,
          amenities: room.amenities || [],
          image: room.images && room.images[0] || null, // First image for backward compatibility
          images: room.images || [], // Full images array
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
      type: t.String(), // เพิ่มฟิลด์ type
      capacity: t.Number(),
      price: t.Number(),
      description: t.Optional(t.String()),
      amenities: t.Optional(t.Array(t.String())),
      image: t.Optional(t.String()),
      images: t.Optional(t.Array(t.String())),
      available: t.Optional(t.Boolean()),
      size_sqm: t.Optional(t.Number())
    })
  })
  
  // Delete room (Admin)
  .delete('/:id', async ({ params, headers, set }) => {
    try {
      // Manual auth check
      const user = await authMiddleware({ headers, set });
      if (!user || user.error) {
        return user || { error: 'Authentication required' };
      }

      // Check if user is admin
      if (user.role !== 'admin') {
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
      // Manual auth check
      const user = await authMiddleware({ headers, set });
      if (!user || user.error) {
        return user || { error: 'Authentication required' };
      }

      // Check if user is admin
      if (user.role !== 'admin') {
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
