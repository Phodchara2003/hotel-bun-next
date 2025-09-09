import { Elysia } from 'elysia';
import { db, parseRows, parseRow } from '../db/sqlite.js';
import { authMiddleware } from '../middleware/auth.js';

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

      // Use SQLite database
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const offset = (pageNum - 1) * limitNum;
      
      let whereCondition = 'WHERE user_id = ?';
      let params = [user.id];
      
      if (unread_only === 'true') {
        whereCondition += ` AND is_read = 0`;
      }
      
      if (type) {
        whereCondition += ` AND type = ?`;
        params.push(type);
      }

      // Get notifications from SQLite
      const query = `
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
        LIMIT ? OFFSET ?
      `;
      
      params.push(limitNum, offset);
      const notifications = db.prepare(query).all(...params);
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM notifications ${whereCondition}`;
      const countResult = db.prepare(countQuery).get(...params.slice(0, -2));
      
      const total = countResult.total;

      return {
        notifications: parseRows(notifications).map(notification => ({
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
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        summary: {
          totalNotifications: total,
          unreadCount: getUnreadCount(user.id)
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

      const count = getUnreadCount(user.id);
      
      return { unreadCount: count };
    } catch (error) {
      console.error('Get unread count error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Mark notification as read
  .patch('/:id/read', async ({ params, headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const notificationId = parseInt(params.id);
      
      const updateQuery = `
        UPDATE notifications 
        SET is_read = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `;
      
      const result = db.prepare(updateQuery).run(notificationId, user.id);
      
      if (result.changes === 0) {
        set.status = 404;
        return { error: 'Notification not found' };
      }

      return { success: true, message: 'Notification marked as read' };
    } catch (error) {
      console.error('Mark notification read error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  })

  // Mark all notifications as read
  .patch('/mark-all-read', async ({ headers, set }) => {
    try {
      const user = await authMiddleware({ headers, set });
      if (user.error) return user;

      const updateQuery = `
        UPDATE notifications 
        SET is_read = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND is_read = 0
      `;
      
      const result = db.prepare(updateQuery).run(user.id);
      
      return { 
        success: true, 
        message: `${result.changes} notifications marked as read` 
      };
    } catch (error) {
      console.error('Mark all notifications read error:', error);
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
      
      const deleteQuery = `DELETE FROM notifications WHERE id = ? AND user_id = ?`;
      const result = db.prepare(deleteQuery).run(notificationId, user.id);
      
      if (result.changes === 0) {
        set.status = 404;
        return { error: 'Notification not found' };
      }

      return { success: true, message: 'Notification deleted' };
    } catch (error) {
      console.error('Delete notification error:', error);
      set.status = 500;
      return { error: 'Internal server error' };
    }
  });

// Helper function to get unread count
const getUnreadCount = (userId) => {
  try {
    const query = `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`;
    const result = db.prepare(query).get(userId);
    return result.count;
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
};

// Function to create notification (used by other services)
export const createNotification = (userId, title, message, type = 'info', bookingId = null) => {
  try {
    const insertQuery = `
      INSERT INTO notifications (user_id, title, message, type, booking_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    const result = db.prepare(insertQuery).run(userId, title, message, type, bookingId);
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};
