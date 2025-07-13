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
      
      const hotel = await sql`
        SELECT * FROM hotels WHERE id = ${hotelId}
      `;
      
      if (!hotel.length) {
        set.status = 404;
        return { error: 'Hotel not found' };
      }
      
      // Get room types for this hotel
      const roomTypes = await sql`
        SELECT * FROM room_types 
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
        images: hotelData.images,
        amenities: hotelData.amenities,
        roomTypes: roomTypes.map(rt => ({
          id: rt.id,
          name: rt.name,
          description: rt.description,
          pricePerNight: parseFloat(rt.price_per_night),
          maxGuests: rt.max_guests,
          sizeSqm: rt.size_sqm,
          amenities: rt.amenities,
          images: rt.images,
          image: rt.image // เพิ่ม field image (base64/url) ที่แอดมินอัปโหลด
        })),
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
      
      // Find available room types
      const availableRoomTypes = await sql`
        SELECT DISTINCT rt.*, h.name as hotel_name, h.city, h.rating, h.images as hotel_images
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
          amenities: rt.amenities,
          images: rt.images,
          image: rt.image // เพิ่ม field image (base64/url) ที่แอดมินอัปโหลด
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
  });
