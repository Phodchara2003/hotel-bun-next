import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { authMiddleware, requireAdmin, requireStaff } from '../middleware/auth.js';
import { bookingSchema } from '../schemas/validation.js';
import { generateBookingReference } from '../utils/auth.js';
import { createNotification, NotificationTemplates } from './notifications.js';
import { automaticEmailNotifications } from '../utils/automaticEmailService.js';
import { notificationService } from '../utils/notificationService.js';

export const bookingRoutes = new Elysia({ prefix: '/bookings' })
  // GET endpoints with specific paths first (to avoid conflicts)
  .get('/admin/all', async ({ headers, query, set }) => {
    try {
      console.log('Admin all bookings request received');
      
      // Authenticate staff or admin
      const user = await requireStaff({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      console.log('Authenticated user:', { id: user.id, role: user.role });
      
      const { page = 1, limit = 50, status, checkInDate, checkOutDate, date } = query;
      const offset = (page - 1) * limit;
      
      console.log('Query params:', { page, limit, status, checkInDate, checkOutDate, date, offset });
      
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;
      
      if (status) {
        whereConditions.push(`b.status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }
      
      // Filter by specific date (check if booking covers this date)
      if (date) {
        whereConditions.push(`DATE($${paramIndex}) BETWEEN DATE(b.check_in_date) AND DATE(b.check_out_date)`);
        params.push(date);
        paramIndex++;
      }
      
      // Filter by check-in date
      if (checkInDate) {
        whereConditions.push(`DATE(b.check_in_date) = DATE($${paramIndex})`);
        params.push(checkInDate);
        paramIndex++;
      }
      
      // Filter by check-out date  
      if (checkOutDate) {
        whereConditions.push(`DATE(b.check_out_date) = DATE($${paramIndex})`);
        params.push(checkOutDate);
        paramIndex++;
      }
      
      const whereCondition = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      console.log('Executing bookings query...');
      
      const bookings = await sql.unsafe(`
        SELECT b.*, h.name as hotel_name, h.city, rt.name as room_type_name,
               u.email as user_email
        FROM bookings b
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN users u ON b.user_id = u.id
        ${whereCondition}
        ORDER BY b.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);
      
      console.log('Bookings query result count:', bookings.length);
      
      // Get total count
      console.log('Executing count query...');
      const countResult = await sql.unsafe(`
        SELECT COUNT(*) as total FROM bookings b 
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN users u ON b.user_id = u.id
        ${whereCondition}
      `, params);
      
      const total = parseInt(countResult[0].total);
      console.log('Total bookings count:', total);
      
      const result = {
        bookings: bookings.map(booking => ({
          id: booking.id,
          bookingReference: booking.booking_reference,
          userEmail: booking.user_email || 'N/A',
          hotelName: booking.hotel_name || 'N/A',
          city: booking.city || 'N/A',
          roomTypeName: booking.room_type_name || 'N/A',
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          guests: booking.guests,
          totalPrice: parseFloat(booking.total_price),
          status: booking.status,
          specialRequests: booking.special_requests,
          guestName: booking.guest_name,
          guestPhone: booking.guest_phone,
          guestEmail: booking.guest_email,
          guestAddress: booking.guest_address,
          guestIdNumber: booking.guest_id_number,
          paymentReceiptUrl: booking.payment_receipt_url,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
      
      console.log('Returning result with', result.bookings.length, 'bookings');
      return result;
    } catch (error) {
      console.error('Get all bookings error:', error);
      console.error('Error stack:', error.stack);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  })
  
  // Admin get booking by ID  
  .get('/admin/:id', async ({ params, headers, set }) => {
    try {
      console.log('Admin get booking by id request received');
      
      // Authenticate staff or admin
      const user = await requireStaff({ headers, set });
      if (user.error) {
        console.log('Authentication failed:', user.error);
        return user;
      }
      
      console.log('Authenticated user:', { id: user.id, role: user.role });
      
      const bookingId = parseInt(params.id);
      
      const booking = await sql`
        SELECT b.*, h.name as hotel_name, h.address, h.city, h.country,
               rt.name as room_type_name, rt.description as room_description,
               rt.amenities as room_amenities, rt.price_per_night,
               u.email as user_email, u.first_name, u.last_name
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.id
        JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.id = ${bookingId}
      `;
      
      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found' };
      }
      
      const bookingData = booking[0];
      
      return {
        id: bookingData.id,
        bookingReference: bookingData.booking_reference,
        userEmail: bookingData.user_email || 'N/A',
        userName: `${bookingData.first_name || ''} ${bookingData.last_name || ''}`.trim() || 'N/A',
        hotel: {
          name: bookingData.hotel_name,
          address: bookingData.address,
          city: bookingData.city,
          country: bookingData.country
        },
        roomType: {
          name: bookingData.room_type_name,
          description: bookingData.room_description,
          amenities: bookingData.room_amenities || [],
          pricePerNight: parseFloat(bookingData.price_per_night)
        },
        checkInDate: bookingData.check_in_date,
        checkOutDate: bookingData.check_out_date,
        guests: bookingData.guests,
        totalPrice: parseFloat(bookingData.total_price),
        status: bookingData.status,
        specialRequests: bookingData.special_requests,
        guestName: bookingData.guest_name,
        guestPhone: bookingData.guest_phone,
        guestEmail: bookingData.guest_email,
        guestAddress: bookingData.guest_address,
        guestIdNumber: bookingData.guest_id_number,
        paymentReceiptUrl: bookingData.payment_receipt_url,
        createdAt: bookingData.created_at,
        updatedAt: bookingData.updated_at
      };
    } catch (error) {
      console.error('Get booking by ID error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  .get('/admin/debug/all', async ({ headers, set }) => {
    try {
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;
      
      if (user.role !== 'admin') {
        set.status = 403;
        return { error: 'Admin access required' };
      }
      
      // Get all bookings with room info
      const bookings = await sql`
        SELECT 
          b.*,
          rt.name as room_type_name,
          h.name as hotel_name
        FROM bookings b
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        ORDER BY b.created_at DESC
      `;
      
      return {
        totalBookings: bookings.length,
        bookings: bookings.map(booking => ({
          id: booking.id,
          roomTypeId: booking.room_type_id,
          roomTypeName: booking.room_type_name,
          hotelName: booking.hotel_name,
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          status: booking.status,
          createdAt: booking.created_at
        }))
      };
    } catch (error) {
      console.error('Debug bookings error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .get('/availability/:roomTypeId', async ({ params, query, headers, set }) => {
    try {
      console.log('=== CHECKING ROOM AVAILABILITY ===');
      
      // No authentication required for checking availability - this is a public endpoint
      
      const { roomTypeId } = params;
      const { startDate, endDate } = query;
      
      console.log('Checking availability for:', { roomTypeId, startDate, endDate });
      
      if (!startDate || !endDate) {
        set.status = 400;
        return { error: 'startDate and endDate are required' };
      }
      
      // Get existing bookings for this room type
      const existingBookings = await sql`
        SELECT 
          id, 
          check_in_date, 
          check_out_date, 
          status,
          booking_reference
        FROM bookings
        WHERE room_type_id = ${roomTypeId}
        AND status IN ('confirmed', 'pending')
        AND check_out_date > ${startDate}
        AND check_in_date < ${endDate}
        ORDER BY check_in_date
      `;
      
      console.log('Found existing bookings:', existingBookings.length);
      
      // Get room type info (excluding large image fields)
      const roomType = await sql`
        SELECT rt.id, rt.name, rt.max_guests, rt.price_per_night, h.name as hotel_name
        FROM room_types rt
        JOIN hotels h ON rt.hotel_id = h.id
        WHERE rt.id = ${roomTypeId}
      `;
      
      if (!roomType.length) {
        set.status = 404;
        return { error: 'Room type not found' };
      }
      
      return {
        roomType: {
          id: roomType[0].id,
          name: roomType[0].name,
          hotelName: roomType[0].hotel_name,
          maxGuests: roomType[0].max_guests,
          pricePerNight: parseFloat(roomType[0].price_per_night)
        },
        existingBookings: existingBookings.map(booking => ({
          id: booking.id,
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          status: booking.status,
          bookingReference: booking.booking_reference
        })),
        available: existingBookings.length === 0
      };
    } catch (error) {
      console.error('Availability check error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .get('/', async ({ headers, query, set }) => {
    try {
      // Re-enable auth middleware
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;
      
      const { page = 1, limit = 10, status } = query;
      const offset = (page - 1) * limit;
      
      let whereCondition = 'WHERE b.user_id = $1';
      let params = [user.id];
      
      if (status) {
        whereCondition += ' AND b.status = $2';
        params.push(status);
      }
      
      const bookings = await sql.unsafe(`
        SELECT b.*, h.name as hotel_name, h.city, rt.name as room_type_name
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.id
        JOIN room_types rt ON b.room_type_id = rt.id
        ${whereCondition}
        ORDER BY b.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);
      
      // Get total count
      const countResult = await sql.unsafe(`
        SELECT COUNT(*) as total FROM bookings b ${whereCondition}
      `, params);
      
      const total = parseInt(countResult[0].total);
      
      return {
        bookings: bookings.map(booking => ({
          id: booking.id,
          bookingReference: booking.booking_reference,
          hotelName: booking.hotel_name,
          city: booking.city,
          roomTypeName: booking.room_type_name,
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          guests: booking.guests,
          totalPrice: parseFloat(booking.total_price),
          status: booking.status,
          specialRequests: booking.special_requests,
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
      console.error('Get bookings error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .get('/:id', async ({ params, headers, set }) => {
    try {
      // Authenticate user
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;
      
      const bookingId = parseInt(params.id);
      
      const booking = await sql`
        SELECT b.*, h.name as hotel_name, h.address, h.city, h.country,
               rt.name as room_type_name, rt.description as room_description,
               rt.amenities as room_amenities
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.id
        JOIN room_types rt ON b.room_type_id = rt.id
        WHERE b.id = ${bookingId} AND (b.user_id = ${user.id} OR ${['admin', 'staff'].includes(user.role)})
      `;
      
      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found' };
      }
      
      const bookingData = booking[0];
      
      return {
        id: bookingData.id,
        bookingReference: bookingData.booking_reference,
        hotel: {
          name: bookingData.hotel_name,
          address: bookingData.address,
          city: bookingData.city,
          country: bookingData.country
        },
        roomType: {
          name: bookingData.room_type_name,
          description: bookingData.room_description,
          amenities: bookingData.room_amenities
        },
        checkInDate: bookingData.check_in_date,
        checkOutDate: bookingData.check_out_date,
        guests: bookingData.guests,
        totalPrice: parseFloat(bookingData.total_price),
        status: bookingData.status,
        specialRequests: bookingData.special_requests,
        guestName: bookingData.guest_name,
        guestPhone: bookingData.guest_phone,
        guestEmail: bookingData.guest_email,
        guestAddress: bookingData.guest_address,
        guestIdNumber: bookingData.guest_id_number,
        paymentReceiptUrl: bookingData.payment_receipt_url,
        createdAt: bookingData.created_at,
        updatedAt: bookingData.updated_at
      };
    } catch (error) {
      console.error('Get booking details error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // POST endpoints
  .post('/', async ({ body, headers, set }) => {
    try {
      console.log('=== BOOKING REQUEST START ===');
      console.log('Booking request received:', body);
      console.log('Headers:', headers);
      
      // Re-enable auth middleware now that it returns hardcoded user
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Auth failed:', user.error);
        return user;
      }
      
      console.log('User authenticated:', { id: user.id, email: user.email, role: user.role });
      
      try {
        const validatedData = bookingSchema.parse(body);
        console.log('Data validated successfully:', validatedData);
        
        const { hotelId, roomTypeId, checkInDate, checkOutDate, guests, specialRequests } = validatedData;
        
        // Validate dates
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        console.log('Date validation:', {
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          today: today.toISOString()
        });
        
        if (checkIn < today) {
          console.log('Check-in date is in the past');
          set.status = 400;
          return { error: 'Check-in date cannot be in the past' };
        }
        
        if (checkOut <= checkIn) {
          console.log('Check-out date is not after check-in date');
          set.status = 400;
          return { error: 'Check-out date must be after check-in date' };
        }
        
        console.log('Date validation passed');
        
      } catch (validationError) {
        console.log('Validation error:', validationError);
        if (validationError.name === 'ZodError') {
          console.log('Validation error details:', validationError.errors);
          set.status = 400;
          return { error: 'Validation failed', details: validationError.errors };
        }
        throw validationError;
      }
      
      // Extract data from validated request
      const { hotelId, roomTypeId, checkInDate, checkOutDate, guests, specialRequests } = body;
      
      console.log('Looking for room type:', { roomTypeId, hotelId });
      
      // Test database connection first
      try {
        await sql`SELECT 1 as test`;
        console.log('Database connection OK');
      } catch (dbError) {
        console.error('Database connection failed:', dbError);
        set.status = 500;
        return { error: 'Database connection failed' };
      }
      
      // Check if room type exists and has enough capacity
      const roomType = await sql`
        SELECT rt.*, h.name as hotel_name
        FROM room_types rt
        JOIN hotels h ON rt.hotel_id = h.id
        WHERE rt.id = ${roomTypeId} AND rt.hotel_id = ${hotelId}
      `;
      
      console.log('Room type query result:', roomType);
      
      if (!roomType.length) {
        console.log('Room type not found');
        set.status = 404;
        return { error: 'Room type not found' };
      }
      
      console.log('Room type found:', roomType[0]);
      
      if (roomType[0].max_guests < guests) {
        console.log('Not enough capacity:', { maxGuests: roomType[0].max_guests, requestedGuests: guests });
        set.status = 400;
        return { error: 'Room cannot accommodate the requested number of guests' };
      }
      
      // Check availability - only check active bookings
      console.log('Checking availability for:', {
        roomTypeId,
        checkInDate,
        checkOutDate
      });
      
      const existingBookings = await sql`
        SELECT id, check_in_date, check_out_date, status FROM bookings
        WHERE room_type_id = ${roomTypeId}
        AND status IN ('confirmed', 'pending')
        AND check_out_date > ${checkInDate}
        AND check_in_date < ${checkOutDate}
      `;
      
      console.log('Existing bookings found:', existingBookings);
      
      if (existingBookings.length > 0) {
        console.log('Room not available due to existing bookings');
        set.status = 400;
        return { 
          error: 'Room is not available for the selected dates',
          conflictingBookings: existingBookings.map(b => ({
            id: b.id,
            checkIn: b.check_in_date,
            checkOut: b.check_out_date,
            status: b.status
          }))
        };
      }
      
      console.log('Room is available, proceeding with booking...');
      
      // Calculate total price
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalPrice = roomType[0].price_per_night * nights;
      
      // Generate booking reference
      const bookingReference = generateBookingReference();
      
      // Create booking
      const newBooking = await sql`
        INSERT INTO bookings (
          user_id, hotel_id, room_type_id, check_in_date, check_out_date,
          guests, total_price, special_requests, booking_reference
        )
        VALUES (
          ${user.id}, ${hotelId}, ${roomTypeId}, ${checkInDate}, ${checkOutDate},
          ${guests}, ${totalPrice}, ${specialRequests || null}, ${bookingReference}
        )
        RETURNING *
      `;

      const bookingResult = {
        id: newBooking[0].id,
        bookingReference: newBooking[0].booking_reference,
        hotelName: roomType[0].hotel_name,
        roomTypeName: roomType[0].name,
        checkInDate: newBooking[0].check_in_date,
        checkOutDate: newBooking[0].check_out_date,
        guests: newBooking[0].guests,
        totalPrice: parseFloat(newBooking[0].total_price),
        status: newBooking[0].status,
        specialRequests: newBooking[0].special_requests,
        createdAt: newBooking[0].created_at
      };

      // ส่งอีเมลแจ้งเตือนการจองสำเร็จ (ระบบส่งอัตโนมัติ)
      try {
        const bookingEmailData = {
          bookingReference: bookingResult.bookingReference,
          hotelName: bookingResult.hotelName,
          roomTypeName: bookingResult.roomTypeName,
          checkInDate: bookingResult.checkInDate,
          checkOutDate: bookingResult.checkOutDate,
          guests: bookingResult.guests,
          totalPrice: bookingResult.totalPrice,
          status: bookingResult.status,
          specialRequests: bookingResult.specialRequests
        };
        
        const userData = {
          email: user.email,
          first_name: user.first_name || user.firstName,
          last_name: user.last_name || user.lastName
        };
        
        // ระบบส่งอีเมลอัตโนมัติ (ไม่รอผลลัพธ์)
        automaticEmailNotifications.onBookingCreated(bookingEmailData, userData)
          .catch((emailError) => {
            console.error('❌ [SYSTEM] Background email sending failed:', emailError);
          });

        // ส่งการแจ้งเตือน Real-time พร้อมกับอีเมล
        try {
          await notificationService.sendNotification('booking_created', {
            userId: user.id,
            booking: bookingEmailData,
            user: userData
          });
          console.log('✅ Real-time notification sent for booking creation');
        } catch (notifError) {
          console.error('❌ Real-time notification failed:', notifError);
        }
          
      } catch (emailError) {
        console.error('❌ [SYSTEM] Email preparation error:', emailError);
      }

      return {
        message: 'Booking created successfully',
        booking: bookingResult
      };
    } catch (error) {
      console.error('=== BOOKING ERROR ===');
      console.error('Create booking error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.name === 'ZodError') {
        console.log('Validation error details:', error.errors);
        set.status = 400;
        return { error: 'Validation failed', details: error.errors };
      }
      
      // Database connection errors
      if (error.message?.includes('connect') || error.code === 'ECONNREFUSED') {
        console.error('Database connection error');
        set.status = 500;
        return { error: 'Database connection failed' };
      }
      
      console.error('Unexpected error:', error.message);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  })
  .post('/:id/delete', async ({ params, headers, set }) => {
    try {
      console.log('=== ALTERNATIVE DELETE BOOKING REQUEST (POST) ===');
      console.log('Booking ID to delete:', params.id);
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Auth failed:', user.error);
        return user;
      }
      
      console.log('User authenticated:', { id: user.id, email: user.email, role: user.role });
      
      if (user.role !== 'admin') {
        console.log('Access denied: user is not admin, role:', user.role);
        set.status = 403;
        return { error: 'Admin access required' };
      }
      
      const bookingId = parseInt(params.id);
      console.log('Parsed booking ID:', bookingId);
      
      // Check if booking exists
      const booking = await sql`
        SELECT * FROM bookings WHERE id = ${bookingId}
      `;
      
      if (!booking.length) {
        console.log('Booking not found:', bookingId);
        set.status = 404;
        return { error: 'Booking not found' };
      }
      
      console.log('Booking found, proceeding to delete...');
      
      // Get booking details before deletion for email notification
      const bookingToDelete = booking[0];
      
      // Get additional booking details for email
      const fullBookingDetails = await sql`
        SELECT b.*, h.name as hotel_name, rt.name as room_type_name, u.email as user_email,
               u.first_name, u.last_name
        FROM bookings b
        JOIN hotels h ON b.hotel_id = h.id
        JOIN room_types rt ON b.room_type_id = rt.id
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ${bookingId}
      `;
      
      // Delete the booking (guest info is stored in the bookings table directly)
      const bookingDeleted = await sql`DELETE FROM bookings WHERE id = ${bookingId}`;
      console.log('Booking deletion result:', bookingDeleted);
      
      // ส่งอีเมลแจ้งเตือนการยกเลิกการจอง (ระบบส่งอัตโนมัติ)
      if (fullBookingDetails.length > 0) {
        try {
          const bookingDetail = fullBookingDetails[0];
          const bookingEmailData = {
            bookingReference: bookingDetail.booking_reference,
            hotelName: bookingDetail.hotel_name,
            roomTypeName: bookingDetail.room_type_name,
            checkInDate: bookingDetail.check_in_date,
            checkOutDate: bookingDetail.check_out_date,
            guests: bookingDetail.guests,
            totalPrice: parseFloat(bookingDetail.total_price),
            specialRequests: bookingDetail.special_requests
          };
          
          const userData = {
            email: bookingDetail.user_email,
            first_name: bookingDetail.first_name,
            last_name: bookingDetail.last_name
          };
          
          // ระบบส่งอีเมลอัตโนมัติ (ไม่รอผลลัพธ์)
          automaticEmailNotifications.onBookingCancelled(bookingEmailData, userData, 'ยกเลิกโดยผู้ดูแลระบบ')
            .catch((emailError) => {
              console.error('❌ [SYSTEM] Background cancellation email failed:', emailError);
            });

          // ส่งการแจ้งเตือน Real-time พร้อมกับอีเมล
          try {
            await notificationService.sendNotification('booking_cancelled', {
              userId: bookingDetail.user_id,
              booking: bookingEmailData,
              user: userData,
              reason: 'ยกเลิกโดยผู้ดูแลระบบ'
            });
            console.log('✅ Real-time cancellation notification sent');
          } catch (notifError) {
            console.error('❌ Real-time cancellation notification failed:', notifError);
          }
            
        } catch (emailError) {
          console.error('❌ [SYSTEM] Email preparation error for cancellation:', emailError);
        }
      }
      
      console.log('DELETE operation completed successfully');
      
      return {
        message: 'Booking deleted successfully',
        deletedBookingId: bookingId
      };
    } catch (error) {
      console.error('Delete booking error:', error);
      console.error('Error stack:', error.stack);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  })
  .post('/:id/payment-receipt', async ({ params, body, headers, set }) => {
    try {
      // Authenticate user
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;
      
      const { id } = params;
      const { receiptUrl } = body;
      
      if (!receiptUrl) {
        set.status = 400;
        return { error: 'Payment receipt URL is required' };
      }
      
      // Check if booking exists and belongs to user (or user is admin)
      const booking = await sql`
        SELECT * FROM bookings 
        WHERE id = ${id} AND (user_id = ${user.id} OR ${user.role === 'admin'})
      `;
      
      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found or access denied' };
      }
      
      // Update booking with payment receipt URL
      const updatedBooking = await sql`
        UPDATE bookings 
        SET payment_receipt_url = ${receiptUrl}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      return {
        message: 'Payment receipt uploaded successfully',
        booking: updatedBooking[0]
      };
    } catch (error) {
      console.error('Error uploading payment receipt:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // PUT endpoints
  .put('/:id/confirm', async ({ params, headers, set }) => {
    try {
      // Authenticate staff or admin
      const user = await requireStaff({ headers, set });
      if (user.error) return user;
      
      const bookingId = parseInt(params.id);
      
      // Check if booking exists
      const booking = await sql`
        SELECT b.*, h.name as hotel_name, rt.name as room_type_name
        FROM bookings b
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        WHERE b.id = ${bookingId}
      `;
      
      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found' };
      }
      
      const bookingData = booking[0];
      
      if (bookingData.status !== 'pending') {
        set.status = 400;
        return { error: 'Only pending bookings can be confirmed' };
      }
      
      // Confirm booking
      const updatedBooking = await sql`
        UPDATE bookings
        SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${bookingId}
        RETURNING *
      `;

      // Send notification to user
      try {
        const template = NotificationTemplates.BOOKING_CONFIRMED(
          bookingData.booking_reference,
          bookingData.hotel_name,
          bookingData.check_in_date
        );
        await createNotification(
          bookingData.user_id,
          bookingId,
          template.type,
          template.title,
          template.message
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the booking confirmation if notification fails
      }
      
      return {
        message: 'Booking confirmed successfully',
        booking: {
          id: updatedBooking[0].id,
          status: updatedBooking[0].status,
          updatedAt: updatedBooking[0].updated_at
        }
      };
    } catch (error) {
      console.error('Confirm booking error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .put('/:id/approve', async ({ params, headers, set }) => {
    try {
      // Authenticate admin only
      const user = await requireAdmin({ headers, set });
      if (user.error) return user;
      
      const bookingId = parseInt(params.id);
      
      // Check if booking exists
      const booking = await sql`
        SELECT b.*, h.name as hotel_name, rt.name as room_type_name
        FROM bookings b
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        WHERE b.id = ${bookingId}
      `;
      
      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found' };
      }
      
      const bookingData = booking[0];
      
      if (bookingData.status !== 'confirmed') {
        set.status = 400;
        return { error: 'Only confirmed bookings can be approved' };
      }
      
      // Check if customer info is filled
      if (!bookingData.guest_name || !bookingData.guest_phone || !bookingData.guest_email) {
        set.status = 400;
        return { error: 'Customer information must be completed before approval' };
      }
      
      // Approve booking (mark as completed)
      const updatedBooking = await sql`
        UPDATE bookings
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${bookingId}
        RETURNING *
      `;

      // Send notification to user
      try {
        const template = NotificationTemplates.BOOKING_APPROVED(
          bookingData.booking_reference,
          bookingData.hotel_name,
          bookingData.check_in_date
        );
        await createNotification(
          bookingData.user_id,
          bookingId,
          template.type,
          template.title,
          template.message
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the booking approval if notification fails
      }
      
      return {
        message: 'Booking approved successfully',
        booking: {
          id: updatedBooking[0].id,
          status: updatedBooking[0].status,
          updatedAt: updatedBooking[0].updated_at
        }
      };
    } catch (error) {
      console.error('Approve booking error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .put('/:id/customer-info', async ({ params, body, headers, set }) => {
    try {
      // Authenticate user
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;
      
      const bookingId = parseInt(params.id);
      const { guestName, guestPhone, guestEmail, guestAddress, guestIdNumber, specialRequests } = body;
      
      // Check if booking exists and belongs to user or user is admin
      const booking = await sql`
        SELECT * FROM bookings WHERE id = ${bookingId} AND (user_id = ${user.id} OR ${user.role === 'admin'})
      `;
      
      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found' };
      }
      
      // Update booking with customer info (don't change status to completed)
      const updatedBooking = await sql`
        UPDATE bookings
        SET 
          guest_name = ${guestName},
          guest_phone = ${guestPhone},
          guest_email = ${guestEmail},
          guest_address = ${guestAddress || null},
          guest_id_number = ${guestIdNumber || null},
          special_requests = ${specialRequests || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${bookingId}
        RETURNING *
      `;
      
      return {
        message: 'Customer information saved successfully. Please wait for admin approval.',
        booking: {
          id: updatedBooking[0].id,
          status: updatedBooking[0].status,
          guestName: updatedBooking[0].guest_name,
          guestPhone: updatedBooking[0].guest_phone,
          guestEmail: updatedBooking[0].guest_email,
          updatedAt: updatedBooking[0].updated_at
        }
      };
    } catch (error) {
      console.error('Save customer info error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Update booking status (Admin)
  .put('/:id/status', async ({ params, body, headers, set }) => {
    try {
      console.log('=== UPDATE BOOKING STATUS REQUEST ===');
      console.log('Booking ID:', params.id);
      console.log('New status:', body.status);
      
      // Authenticate staff or admin
      const user = await requireStaff({ headers, set });
      if (user.error) {
        console.log('Auth failed:', user.error);
        return user;
      }
      
      console.log('User authenticated:', { id: user.id, role: user.role });
      
      const bookingId = parseInt(params.id);
      const { status } = body;
      
      // Validate status
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!status || !validStatuses.includes(status)) {
        set.status = 400;
        return { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') };
      }
      
      // Check if booking exists
      const booking = await sql`
        SELECT b.*, h.name as hotel_name, rt.name as room_type_name
        FROM bookings b
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        WHERE b.id = ${bookingId}
      `;
      
      if (!booking.length) {
        console.log('Booking not found:', bookingId);
        set.status = 404;
        return { error: 'Booking not found' };
      }
      
      const bookingData = booking[0];
      console.log('Current booking status:', bookingData.status, '-> New status:', status);
      
      // Update booking status
      const updatedBooking = await sql`
        UPDATE bookings
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${bookingId}
        RETURNING *
      `;
      
      console.log('Booking status updated successfully');
      
      // Send notification to user based on status change
      try {
        let template;
        switch (status) {
          case 'confirmed':
            template = NotificationTemplates.BOOKING_CONFIRMED(
              bookingData.booking_reference,
              bookingData.hotel_name,
              bookingData.check_in_date
            );
            break;
          case 'completed':
            template = NotificationTemplates.BOOKING_APPROVED(
              bookingData.booking_reference,
              bookingData.hotel_name,
              bookingData.check_in_date
            );
            break;
          case 'cancelled':
            template = NotificationTemplates.BOOKING_CANCELLED(
              bookingData.booking_reference,
              bookingData.hotel_name
            );
            break;
        }
        
        if (template) {
          await createNotification(
            bookingData.user_id,
            bookingId,
            template.type,
            template.title,
            template.message
          );
          console.log('Notification sent to user');
        }
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the status update if notification fails
      }
      
      return {
        message: `Booking status updated to ${status} successfully`,
        booking: {
          id: updatedBooking[0].id,
          status: updatedBooking[0].status,
          updatedAt: updatedBooking[0].updated_at
        }
      };
    } catch (error) {
      console.error('Update booking status error:', error);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  })

  // Cancel booking (User)
  .put('/:id/cancel', async ({ params, headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const bookingId = parseInt(params.id);
      
      // Check if booking exists and belongs to user
      const booking = await sql`
        SELECT b.*, h.name as hotel_name, rt.name as room_type_name
        FROM bookings b
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        WHERE b.id = ${bookingId} AND b.user_id = ${user.id}
      `;
      
      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found' };
      }

      const bookingData = booking[0];

      if (bookingData.status === 'cancelled') {
        set.status = 400;
        return { error: 'Booking is already cancelled' };
      }

      if (bookingData.status === 'completed') {
        set.status = 400;
        return { error: 'Cannot cancel completed booking' };
      }

      // Cancel booking
      const updatedBooking = await sql`
        UPDATE bookings
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${bookingId}
        RETURNING *
      `;

      return {
        message: 'Booking cancelled successfully',
        booking: {
          id: updatedBooking[0].id,
          status: updatedBooking[0].status,
          updatedAt: updatedBooking[0].updated_at
        }
      };
    } catch (error) {
      console.error('Cancel booking error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Admin/Staff cancel booking
  .put('/admin/:id/cancel', async ({ params, headers, set }) => {
    try {
      const user = await requireStaff({ headers, set });
      if (user.error) return user;

      const bookingId = parseInt(params.id);
      
      // Check if booking exists
      const booking = await sql`
        SELECT b.*, h.name as hotel_name, rt.name as room_type_name
        FROM bookings b
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        WHERE b.id = ${bookingId}
      `;
      
      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found' };
      }

      const bookingData = booking[0];

      if (bookingData.status === 'cancelled') {
        set.status = 400;
        return { error: 'Booking is already cancelled' };
      }

      if (bookingData.status === 'completed') {
        set.status = 400;
        return { error: 'Cannot cancel completed booking' };
      }

      // Cancel booking
      const updatedBooking = await sql`
        UPDATE bookings
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${bookingId}
        RETURNING *
      `;

      // Send notification to user
      try {
        const template = NotificationTemplates.BOOKING_CANCELLED(
          bookingData.booking_reference,
          bookingData.hotel_name
        );
        await createNotification(
          bookingData.user_id,
          bookingId,
          template.type,
          template.title,
          template.message
        );
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the booking cancellation if notification fails
      }

      return {
        message: 'Booking cancelled successfully',
        booking: {
          id: updatedBooking[0].id,
          status: updatedBooking[0].status,
          updatedAt: updatedBooking[0].updated_at
        }
      };
    } catch (error) {
      console.error('Admin cancel booking error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  
  // DELETE endpoints - placed at the end to avoid conflicts with parameterized routes
  .delete('/admin/clear-all', async ({ headers, set }) => {
    try {
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;
      
      if (user.role !== 'admin') {
        set.status = 403;
        return { error: 'Admin access required' };
      }
      
      // Delete all bookings
      const result = await sql`DELETE FROM bookings`;
      
      return {
        message: `Cleared all ${result.count} bookings`,
        success: true
      };
    } catch (error) {
      console.error('Clear all bookings error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })
  .delete('/:id', async ({ params, headers, set }) => {
    try {
      console.log('=== DELETE BOOKING REQUEST ===');
      console.log('Booking ID to delete:', params.id);
      
      // Authenticate admin
      const user = await authMiddleware({ headers, set });
      if (user.error) {
        console.log('Auth failed:', user.error);
        return user;
      }
      
      console.log('User authenticated:', { id: user.id, email: user.email, role: user.role });
      
      if (user.role !== 'admin') {
        console.log('Access denied: user is not admin, role:', user.role);
        set.status = 403;
        return { error: 'Admin access required' };
      }
      
      const bookingId = parseInt(params.id);
      console.log('Parsed booking ID:', bookingId);
      
      // Check if booking exists
      const booking = await sql`
        SELECT * FROM bookings WHERE id = ${bookingId}
      `;
      
      if (!booking.length) {
        console.log('Booking not found:', bookingId);
        set.status = 404;
        return { error: 'Booking not found' };
      }
      
      console.log('Booking found, proceeding to delete...');
      
      // Delete the booking (guest info is stored in the bookings table directly)
      const bookingDeleted = await sql`DELETE FROM bookings WHERE id = ${bookingId}`;
      console.log('Booking deletion result:', bookingDeleted);
      
      console.log('DELETE operation completed successfully');
      
      return {
        message: 'Booking deleted successfully',
        deletedBookingId: bookingId
      };
    } catch (error) {
      console.error('Delete booking error:', error);
      console.error('Error stack:', error.stack);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  })
  // Optimized endpoint for reports
  .get('/admin/reports', async ({ headers, query, set }) => {
    try {
      console.log('Admin reports request received');
      
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
      
      const { 
        startDate, 
        endDate, 
        reportType = 'financial', 
        period = 'monthly',
        limit = 1000 
      } = query;
      
      console.log('Reports query params:', { startDate, endDate, reportType, period, limit });
      
      let whereCondition = '';
      let params = [];
      
      // Date range filter
      if (startDate && endDate) {
        whereCondition = 'WHERE b.check_in_date >= $1 AND b.check_in_date <= $2';
        params.push(startDate, endDate);
      }
      
      // Additional status filter for financial reports
      if (reportType === 'financial') {
        const statusFilter = whereCondition ? ' AND' : ' WHERE';
        whereCondition += `${statusFilter} b.status IN ('confirmed', 'completed')`;
      }
      
      console.log('Executing reports query...');
      
      // Use optimized query with necessary fields only
      const bookings = await sql.unsafe(`
        SELECT 
          b.id,
          b.check_in_date,
          b.check_out_date,
          b.total_price,
          b.status,
          rt.name as room_type,
          b.payment_receipt_url,
          b.created_at
        FROM bookings b
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        ${whereCondition}
        ORDER BY b.check_in_date DESC
        LIMIT $${params.length + 1}
      `, [...params, limit]);
      
      console.log('Reports query result count:', bookings.length);
      
      // Return minimal data for better performance
      const result = {
        bookings: bookings.map(booking => ({
          id: booking.id,
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          totalPrice: parseFloat(booking.total_price) || 0,
          status: booking.status,
          roomType: booking.room_type || 'ไม่ระบุ',
          paymentReceipt: booking.payment_receipt_url ? true : false,
          createdAt: booking.created_at
        })),
        reportType,
        period,
        dateRange: { startDate, endDate },
        totalCount: bookings.length
      };
      
      console.log('Returning reports result with', result.bookings.length, 'bookings');
      return result;
    } catch (error) {
      console.error('Get reports error:', error);
      set.status = 500;
      return { error: 'Internal server error', details: error.message };
    }
  });
