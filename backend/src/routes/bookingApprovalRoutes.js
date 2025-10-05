// API Endpoints สำหรับการจัดการการอนุมัติการจอง
import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { requireAdmin, requireStaff } from '../middleware/auth.js';
import { sendBookingApprovalEmail, sendBookingRejectionEmail, sendRequestAdditionalInfoEmail } from '../utils/emailService.js';
import { notificationService } from '../utils/notificationService.js';

export const bookingApprovalRoutes = new Elysia({ prefix: '/api/bookings' })
  
  // รายการการจองที่รอการอนุมัติ
  .get('/pending-approval', async ({ headers, set, query }) => {
    try {
      // ต้องเป็น staff หรือ admin
      const user = await requireStaff({ headers, set });
      if (user.error) return user;

      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const offset = (page - 1) * limit;

      // ดึงการจองที่รอการอนุมัติ
      const pendingBookings = await sql`
        SELECT 
          b.*,
          u.email as customer_email,
          u.first_name,
          u.last_name,
          u.phone,
          h.name as hotel_name,
          h.address as hotel_address,
          rt.name as room_type_name,
          rt.price_per_night
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        WHERE b.status = 'pending'
        ORDER BY b.created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const [totalCount] = await sql`
        SELECT COUNT(*) as count
        FROM bookings 
        WHERE status = 'pending'
      `;

      return {
        bookings: pendingBookings.map(booking => ({
          id: booking.id,
          bookingReference: booking.booking_reference,
          customerName: `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
          customerEmail: booking.customer_email,
          customerPhone: booking.phone,
          hotelName: booking.hotel_name,
          hotelAddress: booking.hotel_address,
          roomTypeName: booking.room_type_name,
          pricePerNight: parseFloat(booking.price_per_night),
          checkInDate: booking.check_in_date,
          checkOutDate: booking.check_out_date,
          guests: booking.guests,
          totalPrice: parseFloat(booking.total_price),
          specialRequests: booking.special_requests,
          guestName: booking.guest_name,
          guestPhone: booking.guest_phone,
          guestEmail: booking.guest_email,
          guestAddress: booking.guest_address,
          guestIdNumber: booking.guest_id_number,
          paymentReceiptUrl: booking.payment_receipt_url,
          createdAt: booking.created_at,
          status: booking.status
        })),
        pagination: {
          page,
          limit,
          total: parseInt(totalCount.count),
          totalPages: Math.ceil(totalCount.count / limit)
        }
      };

    } catch (error) {
      console.error('Get pending bookings error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // อนุมัติการจอง
  .post('/:id/approve', async ({ params, body, headers, set }) => {
    try {
      // ต้องเป็น admin เท่านั้น
      const user = await requireAdmin({ headers, set });
      if (user.error) return user;

      const bookingId = parseInt(params.id);
      const { approvalNotes } = body;

      // ตรวจสอบการจองที่ต้องการอนุมัติ
      const booking = await sql`
        SELECT 
          b.*,
          u.email as customer_email,
          u.first_name,
          u.last_name,
          h.name as hotel_name,
          rt.name as room_type_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        WHERE b.id = ${bookingId} AND b.status = 'pending'
      `;

      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found or already processed' };
      }

      const bookingData = booking[0];

      // อนุมัติการจอง
      await sql`
        UPDATE bookings 
        SET 
          status = 'approved',
          approval_notes = ${approvalNotes || null},
          approved_by = ${user.id},
          approved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${bookingId}
      `;

      // เตรียมข้อมูลสำหรับส่งอีเมล
      const emailData = {
        bookingId: bookingData.id,
        bookingReference: bookingData.booking_reference,
        hotelName: bookingData.hotel_name,
        roomTypeName: bookingData.room_type_name,
        checkInDate: bookingData.check_in_date,
        checkOutDate: bookingData.check_out_date,
        guests: bookingData.guests,
        totalPrice: parseFloat(bookingData.total_price)
      };

      const customerName = `${bookingData.first_name || ''} ${bookingData.last_name || ''}`.trim();

      // ส่งอีเมลแจ้งการอนุมัติแก่ลูกค้า
      try {
        await sendBookingApprovalEmail(bookingData.customer_email, emailData, customerName);
        console.log('✅ Booking approval email sent to customer');
      } catch (emailError) {
        console.error('❌ Failed to send approval email:', emailError);
      }

      // ส่งการแจ้งเตือน Real-time
      try {
        await notificationService.sendNotification('booking_approved', {
          userId: bookingData.user_id,
          booking: emailData,
          user: {
            firstName: bookingData.first_name,
            lastName: bookingData.last_name,
            email: bookingData.customer_email
          }
        });
        console.log('✅ Real-time notification sent for booking approval');
      } catch (notifError) {
        console.error('❌ Real-time notification failed:', notifError);
      }

      return {
        success: true,
        message: 'Booking approved successfully',
        bookingId: bookingId,
        approvedBy: user.id,
        approvedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Approve booking error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // ปฏิเสธการจอง
  .post('/:id/reject', async ({ params, body, headers, set }) => {
    try {
      // ต้องเป็น admin เท่านั้น
      const user = await requireAdmin({ headers, set });
      if (user.error) return user;

      const bookingId = parseInt(params.id);
      const { rejectionReason } = body;

      if (!rejectionReason) {
        set.status = 400;
        return { error: 'Rejection reason is required' };
      }

      // ตรวจสอบการจองที่ต้องการปฏิเสธ
      const booking = await sql`
        SELECT 
          b.*,
          u.email as customer_email,
          u.first_name,
          u.last_name,
          h.name as hotel_name,
          rt.name as room_type_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        WHERE b.id = ${bookingId} AND b.status = 'pending'
      `;

      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found or already processed' };
      }

      const bookingData = booking[0];

      // ปฏิเสธการจอง
      await sql`
        UPDATE bookings 
        SET 
          status = 'rejected',
          rejection_reason = ${rejectionReason},
          rejected_by = ${user.id},
          rejected_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${bookingId}
      `;

      // เตรียมข้อมูลสำหรับส่งอีเมล
      const emailData = {
        bookingId: bookingData.id,
        bookingReference: bookingData.booking_reference,
        hotelName: bookingData.hotel_name,
        roomTypeName: bookingData.room_type_name,
        checkInDate: bookingData.check_in_date,
        checkOutDate: bookingData.check_out_date,
        guests: bookingData.guests,
        totalPrice: parseFloat(bookingData.total_price)
      };

      const customerName = `${bookingData.first_name || ''} ${bookingData.last_name || ''}`.trim();

      // ส่งอีเมลแจ้งการปฏิเสธแก่ลูกค้า
      try {
        await sendBookingRejectionEmail(bookingData.customer_email, emailData, rejectionReason, customerName);
        console.log('✅ Booking rejection email sent to customer');
      } catch (emailError) {
        console.error('❌ Failed to send rejection email:', emailError);
      }

      // ส่งการแจ้งเตือน Real-time
      try {
        await notificationService.sendNotification('booking_rejected', {
          userId: bookingData.user_id,
          booking: emailData,
          user: {
            firstName: bookingData.first_name,
            lastName: bookingData.last_name,
            email: bookingData.customer_email
          },
          reason: rejectionReason
        });
        console.log('✅ Real-time notification sent for booking rejection');
      } catch (notifError) {
        console.error('❌ Real-time notification failed:', notifError);
      }

      return {
        success: true,
        message: 'Booking rejected successfully',
        bookingId: bookingId,
        rejectedBy: user.id,
        rejectedAt: new Date().toISOString(),
        reason: rejectionReason
      };

    } catch (error) {
      console.error('Reject booking error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // ขอข้อมูลเพิ่มเติมจากลูกค้า
  .post('/:id/request-info', async ({ params, body, headers, set }) => {
    try {
      // ต้องเป็น staff หรือ admin
      const user = await requireStaff({ headers, set });
      if (user.error) return user;

      const bookingId = parseInt(params.id);
      const { requestedInfo, message } = body;

      if (!requestedInfo || !Array.isArray(requestedInfo) || requestedInfo.length === 0) {
        set.status = 400;
        return { error: 'Requested information list is required' };
      }

      // ตรวจสอบการจอง
      const booking = await sql`
        SELECT 
          b.*,
          u.email as customer_email,
          u.first_name,
          u.last_name,
          h.name as hotel_name,
          rt.name as room_type_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        WHERE b.id = ${bookingId} AND b.status = 'pending'
      `;

      if (!booking.length) {
        set.status = 404;
        return { error: 'Booking not found or already processed' };
      }

      const bookingData = booking[0];

      // อัปเดตสถานะเป็น waiting_for_info
      await sql`
        UPDATE bookings 
        SET 
          status = 'waiting_for_info',
          info_request_message = ${message || null},
          info_requested_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${bookingId}
      `;

      // บันทึกรายการข้อมูลที่ขอ
      for (const info of requestedInfo) {
        await sql`
          INSERT INTO booking_info_requests (booking_id, requested_info, requested_by, created_at)
          VALUES (${bookingId}, ${info}, ${user.id}, CURRENT_TIMESTAMP)
        `;
      }

      // เตรียมข้อมูลสำหรับส่งอีเมล
      const emailData = {
        bookingId: bookingData.id,
        bookingReference: bookingData.booking_reference,
        hotelName: bookingData.hotel_name,
        checkInDate: bookingData.check_in_date,
        checkOutDate: bookingData.check_out_date
      };

      const customerName = `${bookingData.first_name || ''} ${bookingData.last_name || ''}`.trim();

      // ส่งอีเมลขอข้อมูลเพิ่มเติม
      try {
        await sendRequestAdditionalInfoEmail(bookingData.customer_email, emailData, requestedInfo, customerName);
        console.log('✅ Request additional info email sent to customer');
      } catch (emailError) {
        console.error('❌ Failed to send request info email:', emailError);
      }

      return {
        success: true,
        message: 'Information request sent successfully',
        bookingId: bookingId,
        requestedInfo: requestedInfo,
        requestedBy: user.id
      };

    } catch (error) {
      console.error('Request additional info error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // สถิติการอนุมัติ
  .get('/approval-stats', async ({ headers, set, query }) => {
    try {
      // ต้องเป็น staff หรือ admin
      const user = await requireStaff({ headers, set });
      if (user.error) return user;

      const days = parseInt(query.days) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await sql`
        SELECT 
          status,
          COUNT(*) as count,
          AVG(total_price) as avg_price,
          SUM(total_price) as total_revenue
        FROM bookings
        WHERE created_at >= ${startDate.toISOString()}
        GROUP BY status
      `;

      const dailyStats = await sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
        FROM bookings
        WHERE created_at >= ${startDate.toISOString()}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      return {
        summary: stats.map(stat => ({
          status: stat.status,
          count: parseInt(stat.count),
          averagePrice: parseFloat(stat.avg_price) || 0,
          totalRevenue: parseFloat(stat.total_revenue) || 0
        })),
        daily: dailyStats.map(day => ({
          date: day.date,
          totalBookings: parseInt(day.total_bookings),
          pending: parseInt(day.pending),
          approved: parseInt(day.approved),
          rejected: parseInt(day.rejected)
        })),
        period: {
          days: days,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Get approval stats error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });