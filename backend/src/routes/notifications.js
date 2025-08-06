import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { notificationService } from '../utils/notificationService.js';
import { automaticEmailNotifications } from '../utils/automaticEmailService.js';

export const notificationRoutes = new Elysia({ prefix: '/notifications' })
  
  // Get user notifications with pagination and filters
  .get('/', async ({ headers, query, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const { 
        page = 1, 
        limit = 20, 
        unread_only = false,
        type = null 
      } = query;
      
      const offset = (page - 1) * limit;
      
      let whereCondition = 'WHERE n.user_id = $1';
      let params = [user.id];
      let paramIndex = 2;
      
      if (unread_only === 'true') {
        whereCondition += ` AND n.is_read = FALSE`;
      }
      
      if (type) {
        whereCondition += ` AND n.type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }
      
      // Get notifications with booking info
      const notifications = await sql.unsafe(`
        SELECT 
          n.*,
          b.booking_reference,
          b.status as booking_status,
          b.check_in_date,
          b.check_out_date,
          rt.name as room_type_name,
          h.name as hotel_name
        FROM notifications n
        LEFT JOIN bookings b ON n.booking_id = b.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        ${whereCondition}
        ORDER BY n.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, limit, offset]);
      
      // Get total count
      const countResult = await sql.unsafe(`
        SELECT COUNT(*) as total FROM notifications n ${whereCondition}
      `, params);
      
      const total = parseInt(countResult[0].total);
      
      return {
        notifications: notifications.map(notification => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.is_read,
          createdAt: notification.created_at,
          updatedAt: notification.updated_at,
          booking: notification.booking_id ? {
            id: notification.booking_id,
            reference: notification.booking_reference,
            status: notification.booking_status,
            checkInDate: notification.check_in_date,
            checkOutDate: notification.check_out_date,
            roomTypeName: notification.room_type_name,
            hotelName: notification.hotel_name
          } : null
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary: {
          totalNotifications: total,
          unreadCount: await getUnreadCount(user.id)
        }
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Get unread notifications count
  .get('/unread-count', async ({ headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const unreadCount = await getUnreadCount(user.id);
      
      return { unreadCount };
    } catch (error) {
      console.error('Get unread count error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Mark notification as read
  .put('/:id/read', async ({ params, headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const notificationId = parseInt(params.id);
      
      const result = await sql`
        UPDATE notifications 
        SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${notificationId} AND user_id = ${user.id}
        RETURNING *
      `;
      
      if (!result.length) {
        set.status = 404;
        return { error: 'Notification not found' };
      }
      
      return {
        message: 'Notification marked as read',
        notification: result[0]
      };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Mark all notifications as read
  .put('/read-all', async ({ headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const result = await sql`
        UPDATE notifications 
        SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${user.id} AND is_read = FALSE
      `;
      
      return {
        message: 'All notifications marked as read',
        updatedCount: result.count
      };
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Delete notification
  .delete('/:id', async ({ params, headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const notificationId = parseInt(params.id);
      
      const result = await sql`
        DELETE FROM notifications 
        WHERE id = ${notificationId} AND user_id = ${user.id}
      `;
      
      if (result.count === 0) {
        set.status = 404;
        return { error: 'Notification not found' };
      }
      
      return {
        message: 'Notification deleted successfully'
      };
    } catch (error) {
      console.error('Delete notification error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Admin: Send notification to user
  .post('/send', async ({ body, headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      if (user.role !== 'admin') {
        set.status = 403;
        return { error: 'Admin access required' };
      }

      const { 
        userId, 
        bookingId = null, 
        type, 
        title, 
        message 
      } = body;

      if (!userId || !type || !title || !message) {
        set.status = 400;
        return { error: 'Missing required fields' };
      }

      const notification = await createNotification(
        userId,
        bookingId,
        type,
        title,
        message
      );

      return {
        message: 'Notification sent successfully',
        notification
      };
    } catch (error) {
      console.error('Send notification error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });

// Helper functions
async function getUnreadCount(userId) {
  const result = await sql`
    SELECT COUNT(*) as count 
    FROM notifications 
    WHERE user_id = ${userId} AND is_read = FALSE
  `;
  return parseInt(result[0].count);
}

export async function createNotification(userId, bookingId, type, title, message) {
  try {
    const result = await sql`
      INSERT INTO notifications (user_id, booking_id, type, title, message)
      VALUES (${userId}, ${bookingId}, ${type}, ${title}, ${message})
      RETURNING *
    `;
    
    return result[0];
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
}

// Notification templates
export const NotificationTemplates = {
  BOOKING_CONFIRMED: (bookingReference, hotelName, checkInDate) => ({
    type: 'booking_confirmed',
    title: 'การจองได้รับการยืนยันแล้ว',
    message: `การจอง ${bookingReference} ที่โรงแรม ${hotelName} ได้รับการยืนยันแล้ว วันเข้าพัก: ${new Date(checkInDate).toLocaleDateString('th-TH')}`
  }),

  BOOKING_CANCELLED: (bookingReference, hotelName) => ({
    type: 'booking_cancelled',
    title: 'การจองถูกยกเลิก',
    message: `การจอง ${bookingReference} ที่โรงแรม ${hotelName} ถูกยกเลิกแล้ว`
  }),

  BOOKING_APPROVED: (bookingReference, hotelName, checkInDate) => ({
    type: 'booking_approved',
    title: 'การจองได้รับการอนุมัติแล้ว',
    message: `การจอง ${bookingReference} ที่โรงแรม ${hotelName} ได้รับการอนุมัติแล้ว พร้อมเข้าพักได้ในวันที่ ${new Date(checkInDate).toLocaleDateString('th-TH')}`
  }),

  PAYMENT_REMINDER: (bookingReference, hotelName, daysLeft) => ({
    type: 'payment_reminder',
    title: 'แจ้งเตือนการชำระเงิน',
    message: `กรุณาชำระเงินสำหรับการจอง ${bookingReference} ที่โรงแรม ${hotelName} เหลือเวลาอีก ${daysLeft} วัน`
  }),

  CHECK_IN_REMINDER: (bookingReference, hotelName, checkInDate) => ({
    type: 'check_in_reminder',
    title: 'แจ้งเตือนการเข้าพัก',
    message: `เตรียมพร้อมสำหรับการเข้าพัก! การจอง ${bookingReference} ที่โรงแรม ${hotelName} วันที่ ${new Date(checkInDate).toLocaleDateString('th-TH')}`
  })
};
