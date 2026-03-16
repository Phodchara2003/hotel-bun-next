import { automaticEmailNotifications } from '../email/automaticEmailService.js';
import { sql } from '../../db/database.js';

// ระบบแจ้งเตือน Real-time ที่รวมกับ Email
export class NotificationService {
  constructor() {
    this.subscribers = new Map(); // WebSocket connections
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

        // ส่งอีเมลแจ้งเตือน Admin
        try {
          if (type === 'new_booking') {
            await this.sendAdminEmailNotification(admin.email, {
              type: 'new_booking',
              title: 'มีการจองใหม่!',
              message: `มีการจองใหม่จากคุณ ${data.customerName} ที่โรงแรม ${data.hotelName} มูลค่า ${data.amount} บาท`,
              bookingData: data.booking,
              userData: data.user,
              bookingId: data.bookingId
            });
          } else if (type === 'payment_received') {
            await this.sendAdminEmailNotification(admin.email, {
              type: 'payment_received',
              title: 'ได้รับการชำระเงิน',
              message: `ได้รับการชำระเงินสำหรับการจอง ${data.bookingReference} จำนวน ${data.amount} บาท`,
              bookingData: data.booking,
              userData: data.user
            });
          } else if (type === 'cancellation') {
            await this.sendAdminEmailNotification(admin.email, {
              type: 'booking_cancelled',
              title: 'การจองถูกยกเลิก',
              message: `การจอง ${data.bookingReference} ถูกยกเลิกโดย ${data.customerName}`,
              bookingData: data.booking,
              userData: data.user,
              reason: data.reason
            });
          }
        } catch (emailError) {
          console.error(`❌ Failed to send admin email to ${admin.email}:`, emailError);
        }
      }

    } catch (error) {
      console.error('❌ Failed to notify admins:', error);
    }
  }

  // ส่งอีเมลแจ้งเตือน Admin
  async sendAdminEmailNotification(adminEmail, data) {
    try {
      const { automaticAdminEmailNotifications } = await import('../email/adminEmailService.js');
      
      console.log(`📧 Sending admin email notification to ${adminEmail}:`, data.title);
      
      // เลือกฟังก์ชันส่งอีเมลตามประเภท
      switch (data.type) {
        case 'new_booking':
          await automaticAdminEmailNotifications.onNewBooking(data.bookingData, data.userData);
          break;
        case 'payment_received':
          await automaticAdminEmailNotifications.onPaymentReceived(data.bookingData, data.userData);
          break;
        case 'booking_cancelled':
          await automaticAdminEmailNotifications.onBookingCancelled(data.bookingData, data.userData, data.reason);
          break;
        default:
          console.log(`⚠️ No specific admin email template for type: ${data.type}`);
      }
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
      console.log(`✅ Saved notification for ${userIds.length} users`);
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
            try {
              ws.send(JSON.stringify(notification));
              console.log(`📤 Real-time notification sent to user ${userId}`);
            } catch (error) {
              console.error(`❌ Failed to send real-time notification to user ${userId}:`, error);
            }
          }
        });
      }
    });
  }
}

// สร้าง instance เดียวสำหรับทั้งแอป
export const notificationService = new NotificationService();