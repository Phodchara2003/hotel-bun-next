import { automaticEmailNotifications } from './automaticEmailService.js';
import { sql } from '../db/database.js';

// ระบบแจ้งเตือน Real-time ที่รวมกับ Email
export class NotificationService {
  constructor() {
    this.subscribers = new Map(); // WebSocket connections
  }

  // เพิ่ม WebSocket connection
  addSubscriber(userId, ws) {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId).add(ws);
    
    console.log(`🔌 User ${userId} connected to real-time notifications`);
    
    // ส่งการแจ้งเตือนที่ยังไม่ได้อ่าน
    this.sendUnreadNotifications(userId, ws);
  }

  // ลบ WebSocket connection
  removeSubscriber(userId, ws) {
    const userSockets = this.subscribers.get(userId);
    if (userSockets) {
      userSockets.delete(ws);
      if (userSockets.size === 0) {
        this.subscribers.delete(userId);
      }
    }
    console.log(`🔌 User ${userId} disconnected from real-time notifications`);
  }

  // ส่งการแจ้งเตือนแบบ Real-time พร้อมกับอีเมล
  async sendNotification(type, data) {
    try {
      let notification;
      let targetUsers = [];

      switch (type) {
        case 'booking_created':
          notification = await this.createBookingNotification(data);
          targetUsers = [data.userId]; // ส่งให้ลูกค้าที่จอง
          
          // ส่งอีเมลแจ้งเตือนแก่ลูกค้า
          await automaticEmailNotifications.onBookingCreated(data.booking, data.user);
          
          // แจ้งเตือน Admin ทาง Real-time + อีเมล
          await this.notifyAdmins('new_booking', {
            bookingId: data.booking.id,
            customerName: `${data.user.firstName} ${data.user.lastName}`,
            hotelName: data.booking.hotelName,
            amount: data.booking.totalPrice
          });
          break;

        case 'booking_cancelled':
          notification = await this.createCancellationNotification(data);
          targetUsers = [data.userId];
          
          // ส่งอีเมลยกเลิกแก่ลูกค้า
          await automaticEmailNotifications.onBookingCancelled(data.booking, data.user, data.reason);
          break;

        case 'booking_updated':
          notification = await this.createUpdateNotification(data);
          targetUsers = [data.userId];
          
          // ส่งอีเมลอัปเดตแก่ลูกค้า
          await automaticEmailNotifications.onBookingUpdated(data.booking, data.user, data.updateDetails);
          break;

        case 'payment_approved':
          notification = await this.createPaymentNotification(data);
          targetUsers = [data.userId];
          break;

        case 'payment_rejected':
          notification = await this.createPaymentRejectionNotification(data);
          targetUsers = [data.userId];
          break;

        case 'check_in_reminder':
          notification = await this.createReminderNotification(data);
          targetUsers = [data.userId];
          
          // ส่งอีเมลแจ้งเตือนก่อนเข้าพัก
          await automaticEmailNotifications.checkInReminder(data.booking, data.user);
          break;

        default:
          console.log(`⚠️ Unknown notification type: ${type}`);
          return;
      }

      // บันทึกการแจ้งเตือนในฐานข้อมูล
      if (notification) {
        await this.saveNotification(notification, targetUsers);
        
        // ส่งแจ้งเตือน Real-time
        this.broadcastToUsers(targetUsers, notification);
      }

    } catch (error) {
      console.error('❌ Failed to send notification:', error);
    }
  }

  // สร้างการแจ้งเตือนการจองใหม่
  async createBookingNotification(data) {
    return {
      type: 'booking_created',
      title: '🎉 จองสำเร็จแล้ว!',
      message: `การจองที่โรงแรม ${data.booking.hotelName} สำเร็จแล้ว`,
      data: {
        bookingId: data.booking.id,
        bookingReference: data.booking.bookingReference,
        hotelName: data.booking.hotelName,
        checkInDate: data.booking.checkInDate,
        totalPrice: data.booking.totalPrice
      },
      createdAt: new Date().toISOString(),
      priority: 'high'
    };
  }

  // สร้างการแจ้งเตือนการยกเลิก
  async createCancellationNotification(data) {
    return {
      type: 'booking_cancelled',
      title: '❌ การจองถูกยกเลิก',
      message: `การจอง ${data.booking.bookingReference} ถูกยกเลิกแล้ว`,
      data: {
        bookingId: data.booking.id,
        bookingReference: data.booking.bookingReference,
        reason: data.reason || 'ไม่ระบุเหตุผล'
      },
      createdAt: new Date().toISOString(),
      priority: 'high'
    };
  }

  // สร้างการแจ้งเตือนการอัปเดต
  async createUpdateNotification(data) {
    return {
      type: 'booking_updated',
      title: '🔄 ข้อมูลการจองมีการเปลี่ยนแปลง',
      message: `การจอง ${data.booking.bookingReference} มีการอัปเดต`,
      data: {
        bookingId: data.booking.id,
        bookingReference: data.booking.bookingReference,
        updateDetails: data.updateDetails
      },
      createdAt: new Date().toISOString(),
      priority: 'medium'
    };
  }

  // สร้างการแจ้งเตือนการชำระเงินอนุมัติ
  async createPaymentNotification(data) {
    return {
      type: 'payment_approved',
      title: '✅ การชำระเงินได้รับการอนุมัติ',
      message: `การชำระเงินสำหรับการจอง ${data.booking.bookingReference} อนุมัติแล้ว`,
      data: {
        bookingId: data.booking.id,
        bookingReference: data.booking.bookingReference,
        amount: data.amount
      },
      createdAt: new Date().toISOString(),
      priority: 'high'
    };
  }

  // สร้างการแจ้งเตือนการชำระเงินปฏิเสธ
  async createPaymentRejectionNotification(data) {
    return {
      type: 'payment_rejected',
      title: '❌ การชำระเงินไม่ได้รับการอนุมัติ',
      message: `การชำระเงินสำหรับการจอง ${data.booking.bookingReference} ไม่อนุมัติ`,
      data: {
        bookingId: data.booking.id,
        bookingReference: data.booking.bookingReference,
        reason: data.reason || 'ไม่ระบุเหตุผล'
      },
      createdAt: new Date().toISOString(),
      priority: 'high'
    };
  }

  // สร้างการแจ้งเตือนก่อนเข้าพัก
  async createReminderNotification(data) {
    return {
      type: 'check_in_reminder',
      title: '🏨 แจ้งเตือนการเข้าพัก',
      message: `พรุ่งนี้คือวันเข้าพักที่โรงแรม ${data.booking.hotelName}`,
      data: {
        bookingId: data.booking.id,
        bookingReference: data.booking.bookingReference,
        hotelName: data.booking.hotelName,
        checkInDate: data.booking.checkInDate
      },
      createdAt: new Date().toISOString(),
      priority: 'medium'
    };
  }

  // แจ้งเตือน Admin
  async notifyAdmins(type, data) {
    try {
      // ดึงรายชื่อ Admin
      const admins = await sql`
        SELECT id, email, first_name, last_name 
        FROM users 
        WHERE role = 'admin'
      `;

      for (const admin of admins) {
        // ส่งการแจ้งเตือน Real-time
        const adminNotification = {
          type: 'admin_notification',
          subType: type,
          title: this.getAdminNotificationTitle(type),
          message: this.getAdminNotificationMessage(type, data),
          data: data,
          createdAt: new Date().toISOString(),
          priority: 'high'
        };

        // บันทึกในฐานข้อมูล
        await this.saveNotification(adminNotification, [admin.id]);
        
        // ส่ง Real-time
        this.broadcastToUsers([admin.id], adminNotification);

        // ส่งอีเมลแจ้งเตือน Admin (ถ้าต้องการ)
        if (type === 'new_booking') {
          await this.sendAdminEmailNotification(admin.email, {
            title: 'มีการจองใหม่!',
            message: `มีการจองใหม่จากคุณ ${data.customerName} ที่โรงแรม ${data.hotelName} มূลค่า ${data.amount} บาท`,
            bookingId: data.bookingId
          });
        }
      }

    } catch (error) {
      console.error('❌ Failed to notify admins:', error);
    }
  }

  // ส่งอีเมลแจ้งเตือน Admin
  async sendAdminEmailNotification(adminEmail, data) {
    try {
      // ใช้ระบบอีเมลที่มีอยู่ หรือสร้างฟังก์ชันใหม่สำหรับ Admin
      console.log(`📧 Sending admin email notification to ${adminEmail}:`, data.title);
      // TODO: เพิ่มฟังก์ชันส่งอีเมลแจ้งเตือน Admin
    } catch (error) {
      console.error('❌ Failed to send admin email:', error);
    }
  }

  // สร้าง Title สำหรับการแจ้งเตือน Admin
  getAdminNotificationTitle(type) {
    switch (type) {
      case 'new_booking': return '🆕 มีการจองใหม่';
      case 'payment_received': return '💰 ได้รับการชำระเงิน';
      case 'cancellation': return '❌ มีการยกเลิกการจอง';
      default: return '🔔 การแจ้งเตือนจากระบบ';
    }
  }

  // สร้าง Message สำหรับการแจ้งเตือน Admin
  getAdminNotificationMessage(type, data) {
    switch (type) {
      case 'new_booking': 
        return `มีการจองใหม่จาก ${data.customerName} ที่ ${data.hotelName} มูลค่า ${data.amount} บาท`;
      case 'payment_received':
        return `ได้รับการชำระเงินสำหรับการจอง ${data.bookingReference} จำนวน ${data.amount} บาท`;
      case 'cancellation':
        return `การจอง ${data.bookingReference} ถูกยกเลิกโดย ${data.customerName}`;
      default: 
        return 'มีกิจกรรมใหม่ในระบบ';
    }
  }

  // บันทึกการแจ้งเตือนในฐานข้อมูล
  async saveNotification(notification, userIds) {
    try {
      for (const userId of userIds) {
        await sql`
          INSERT INTO notifications (
            user_id, type, title, message, data, priority, created_at, read_at
          ) VALUES (
            ${userId}, ${notification.type}, ${notification.title}, 
            ${notification.message}, ${JSON.stringify(notification.data)}, 
            ${notification.priority}, ${notification.createdAt}, NULL
          )
        `;
      }
      console.log(`💾 Notification saved for ${userIds.length} users`);
    } catch (error) {
      console.error('❌ Failed to save notification:', error);
    }
  }

  // ส่งการแจ้งเตือนแบบ Real-time
  broadcastToUsers(userIds, notification) {
    userIds.forEach(userId => {
      const userSockets = this.subscribers.get(userId);
      if (userSockets) {
        userSockets.forEach(ws => {
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(JSON.stringify({
              type: 'notification',
              payload: notification
            }));
            console.log(`🔔 Real-time notification sent to user ${userId}`);
          }
        });
      }
    });
  }

  // ส่งการแจ้งเตือนที่ยังไม่ได้อ่าน
  async sendUnreadNotifications(userId, ws) {
    try {
      const unreadNotifications = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${userId} AND read_at IS NULL 
        ORDER BY created_at DESC 
        LIMIT 20
      `;

      if (unreadNotifications.length > 0) {
        ws.send(JSON.stringify({
          type: 'unread_notifications',
          payload: unreadNotifications.map(notif => ({
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            data: JSON.parse(notif.data || '{}'),
            priority: notif.priority,
            createdAt: notif.created_at
          }))
        }));
        console.log(`📨 Sent ${unreadNotifications.length} unread notifications to user ${userId}`);
      }
    } catch (error) {
      console.error('❌ Failed to send unread notifications:', error);
    }
  }

  // ดึงการแจ้งเตือนของผู้ใช้
  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const notifications = await sql`
        SELECT * FROM notifications 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;

      const total = await sql`
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = ${userId}
      `;

      return {
        notifications: notifications.map(notif => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          data: JSON.parse(notif.data || '{}'),
          priority: notif.priority,
          createdAt: notif.created_at,
          readAt: notif.read_at,
          isRead: !!notif.read_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total[0].count),
          totalPages: Math.ceil(total[0].count / limit)
        }
      };
    } catch (error) {
      console.error('❌ Failed to get user notifications:', error);
      return { notifications: [], pagination: {} };
    }
  }

  // ทำเครื่องหมายว่าอ่านแล้ว
  async markAsRead(notificationId, userId) {
    try {
      await sql`
        UPDATE notifications 
        SET read_at = NOW() 
        WHERE id = ${notificationId} AND user_id = ${userId}
      `;
      console.log(`✅ Notification ${notificationId} marked as read for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      return false;
    }
  }

  // ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
  async markAllAsRead(userId) {
    try {
      await sql`
        UPDATE notifications 
        SET read_at = NOW() 
        WHERE user_id = ${userId} AND read_at IS NULL
      `;
      console.log(`✅ All notifications marked as read for user ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      return false;
    }
  }
}

// สร้าง instance เดียว
export const notificationService = new NotificationService();
