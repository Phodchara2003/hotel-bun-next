import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { searchSchema } from '../schemas/validation.js';

export const hotelRoutes = new Elysia({ prefix: '/hotels' })
  .get('/', async ({ query, set }) => {
    try {
      const { 
        checkIn, 
        checkOut, 
        guests = 1, 
        minPrice, 
        maxPrice,
        page = 1,
        limit = 10
      } = query;
      
      const offset = (page - 1) * limit;
      
      let whereConditions = [];
      let params = [];
      
      // Build base query (removed city filtering since it's a single hotel)
      let queryStr = `
        SELECT DISTINCT h.*, 
               MIN(rt.price_per_night) as min_price,
               MAX(rt.price_per_night) as max_price,
               COUNT(DISTINCT rt.id) as room_types_count
        FROM hotels h
        LEFT JOIN room_types rt ON h.id = rt.hotel_id
      `;
      
      if (whereConditions.length > 0) {
        queryStr += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      queryStr += `
        GROUP BY h.id, h.name, h.description, h.address, h.city, h.country, h.rating, h.images, h.amenities, h.created_at, h.updated_at
        ORDER BY h.rating DESC, h.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, offset);
      
      const hotels = await sql.unsafe(queryStr, params);
      
      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(DISTINCT h.id) as total
        FROM hotels h
        LEFT JOIN room_types rt ON h.id = rt.hotel_id
      `;
      
      if (whereConditions.length > 0) {
        countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
      }
      
      const countResult = await sql.unsafe(countQuery, params.slice(0, -2));
      const total = parseInt(countResult[0].total);
      
      return {
        hotels: hotels.map(hotel => ({
          id: hotel.id,
          name: hotel.name,
          description: hotel.description,
          address: hotel.address,
          city: hotel.city,
          country: hotel.country,
          rating: parseFloat(hotel.rating),
          images: hotel.images,
          amenities: hotel.amenities,
          minPrice: parseFloat(hotel.min_price),
          maxPrice: parseFloat(hotel.max_price),
          roomTypesCount: parseInt(hotel.room_types_count)
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get hotels error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .get('/:id', async ({ params, set }) => {
    try {
      const hotelId = parseInt(params.id);
      
      // Check if hotel exists first
      const hotelCheck = await sql`
        SELECT id, name, description, address, city, country, rating, amenities, created_at, updated_at
        FROM hotels WHERE id = ${hotelId}
      `;
      
      if (!hotelCheck.length) {
        set.status = 404;
        return { error: 'Hotel not found' };
      }
      
      // Get hotel data without large images first
      const hotel = await sql`
        SELECT id, name, description, address, city, country, rating, amenities, created_at, updated_at
        FROM hotels WHERE id = ${hotelId}
      `;
      
      // Get room types for this hotel (exclude images initially for performance)
      const roomTypes = await sql`
        SELECT id, name, description, price_per_night, max_guests, size_sqm, amenities, hotel_id, type
        FROM room_types 
        WHERE hotel_id = ${hotelId}
        ORDER BY price_per_night ASC
      `;
      
      // Get reviews for this hotel
      const reviews = await sql`
        SELECT r.*, u.first_name, u.last_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.hotel_id = ${hotelId}
        ORDER BY r.created_at DESC
        LIMIT 10
      `;
      
      const hotelData = hotel[0];
      
      return {
        id: hotelData.id,
        name: hotelData.name,
        description: hotelData.description,
        address: hotelData.address,
        city: hotelData.city,
        country: hotelData.country,
        rating: parseFloat(hotelData.rating),
        images: [], // Hotel images handled separately via /api/hotels/hotel-image endpoint
        amenities: hotelData.amenities,
        roomTypes: roomTypes.map(rt => {
          return {
            id: rt.id,
            name: rt.name,
            type: rt.type,
            description: rt.description,
            pricePerNight: parseFloat(rt.price_per_night),
            maxGuests: rt.max_guests,
            sizeSqm: rt.size_sqm,
            amenities: rt.amenities,
            images: [`/api/hotels/room-image/${rt.id}/0`] // First image endpoint
          };
        }),
        reviews: reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          userName: `${review.first_name} ${review.last_name}`,
          createdAt: review.created_at
        }))
      };
    } catch (error) {
      console.error('Get hotel details error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  })

  // Add hotel image endpoint
  .get('/hotel-image/:id/:index', async ({ params, set }) => {
    try {
      const hotelId = parseInt(params.id);
      const imageIndex = parseInt(params.index);
      
      const hotel = await sql`
        SELECT images FROM hotels WHERE id = ${hotelId}
      `;
      
      if (!hotel.length || !hotel[0].images || !Array.isArray(hotel[0].images)) {
        set.status = 404;
        return { error: 'Image not found' };
      }
      
      const images = hotel[0].images;
      if (imageIndex >= images.length || imageIndex < 0) {
        set.status = 404;
        return { error: 'Image index out of range' };
      }
      
      const imageData = images[imageIndex];
      if (!imageData || !imageData.startsWith('data:image')) {
        set.status = 404;
        return { error: 'Invalid image data' };
      }
      
      // Extract image format and data
      const [header, base64Data] = imageData.split(',');
      const mimeMatch = header.match(/data:image\/([^;]+)/);
      const mimeType = mimeMatch ? `image/${mimeMatch[1]}` : 'image/jpeg';
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      set.headers['Content-Type'] = mimeType;
      set.headers['Cache-Control'] = 'public, max-age=86400';
      
      return new Response(buffer);
    } catch (error) {
      console.error('Hotel image serve error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .get('/search/availability', async ({ query, set }) => {
    try {
      const validatedData = searchSchema.parse(query);
      const { checkIn, checkOut, guests } = validatedData;
      
      if (!checkIn || !checkOut) {
        set.status = 400;
        return { error: 'Check-in and check-out dates are required' };
      }
      
      // Find available room types (exclude large base64 images)
      const availableRoomTypes = await sql`
        SELECT DISTINCT rt.id, rt.name, rt.description, rt.price_per_night, rt.max_guests, 
               rt.size_sqm, rt.amenities, rt.hotel_id,
               h.name as hotel_name, h.city, h.rating, h.images as hotel_images
        FROM room_types rt
        JOIN hotels h ON rt.hotel_id = h.id
        WHERE rt.max_guests >= ${guests}
        AND rt.id NOT IN (
          SELECT DISTINCT b.room_type_id
          FROM bookings b
          WHERE b.status IN ('confirmed', 'pending')
          AND (
            (b.check_in_date <= ${checkIn} AND b.check_out_date > ${checkIn})
            OR (b.check_in_date < ${checkOut} AND b.check_out_date >= ${checkOut})
            OR (b.check_in_date >= ${checkIn} AND b.check_out_date <= ${checkOut})
          )
        )
        ORDER BY h.rating DESC, rt.price_per_night ASC
      `;
      
      return {
        availableRooms: availableRoomTypes.map(rt => ({
          id: rt.id,
          hotelId: rt.hotel_id,
          hotelName: rt.hotel_name,
          city: rt.city,
          hotelRating: parseFloat(rt.rating),
          hotelImages: rt.hotel_images,
          name: rt.name,
          description: rt.description,
          pricePerNight: parseFloat(rt.price_per_night),
          maxGuests: rt.max_guests,
          sizeSqm: rt.size_sqm,
          amenities: rt.amenities
          // Removed images field to prevent large response size issues
        }))
      };
    } catch (error) {
      if (error.name === 'ZodError') {
        set.status = 400;
        return { error: 'Validation failed', details: error.errors };
      }
      console.error('Search availability error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // New endpoint to get room images
  .get('/room-images/:roomTypeId', async ({ params, set }) => {
    try {
      const roomTypeId = parseInt(params.roomTypeId);
      
      const room = await sql`
        SELECT images, name, type FROM room_types WHERE id = ${roomTypeId}
      `;
      
      if (!room.length) {
        set.status = 404;
        return { error: 'Room not found' };
      }
      
      const roomData = room[0];
      let images = [];
      
      if (roomData.images && Array.isArray(roomData.images)) {
        // Convert base64 images to data URLs or return URLs as-is
        images = roomData.images.map((img, index) => {
          if (img && img.startsWith('data:image')) {
            // For base64 images, return them as-is but with an API endpoint reference
            return `/api/hotels/room-image/${roomTypeId}/${index}`;
          } else if (img && (img.startsWith('http') || img.startsWith('https'))) {
            // For URL images, return as-is
            return img;
          }
          return null;
        }).filter(Boolean);
      }
      
      return {
        roomId: roomTypeId,
        roomName: roomData.name,
        roomType: roomData.type,
        images
      };
    } catch (error) {
      console.error('Get room images error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // Endpoint to serve individual room image
  .get('/room-image/:roomTypeId/:imageIndex', async ({ params, set }) => {
    try {
      const roomTypeId = parseInt(params.roomTypeId);
      const imageIndex = parseInt(params.imageIndex);
      
      const room = await sql`
        SELECT images FROM room_types WHERE id = ${roomTypeId}
      `;
      
      if (!room.length || !room[0].images || !room[0].images[imageIndex]) {
        set.status = 404;
        return { error: 'Image not found' };
      }
      
      const base64Image = room[0].images[imageIndex];
      
      if (base64Image.startsWith('data:image')) {
        // Extract image data and content type
        const matches = base64Image.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
        if (matches && matches.length === 3) {
          const contentType = `image/${matches[1]}`;
          const imageBuffer = Buffer.from(matches[2], 'base64');
          
          set.headers['content-type'] = contentType;
          set.headers['cache-control'] = 'public, max-age=86400'; // Cache for 1 day
          
          return new Response(imageBuffer);
        }
      }
      
      set.status = 404;
      return { error: 'Invalid image format' };
    } catch (error) {
      console.error('Serve room image error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });
