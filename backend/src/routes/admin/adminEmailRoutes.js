import { Elysia } from 'elysia';
import { requireAdmin } from '../../middleware/auth.js';
import { adminEmailScheduler, sendDailySummaryNow, checkUrgentAlerts } from '../../utils/adminEmailScheduler.js';
import { automaticAdminEmailNotifications } from '../../utils/email/adminEmailService.js';
import { sql } from '../../db/database.js';

console.log('📧 [ADMIN-EMAIL-ROUTES] Loading admin email notification routes...');

export const adminEmailRoutes = new Elysia({ prefix: '/admin/email-notifications' })
  
  // ส่งอีเมลสรุปประจำวันทันที (สำหรับทดสอบ)
  .post('/send-daily-summary', async ({ headers, set }) => {
    try {
      const user = await requireAdmin({ headers, set });
      if (user.error) return user;

      console.log('📧 [ADMIN-EMAIL-API] Manual daily summary request by admin:', user.email);
      
      const result = await sendDailySummaryNow();
      
      return {
        success: true,
        message: `Daily summary sent to ${result.sent}/${result.total} admin(s)`,
        data: result.data
      };
    } catch (error) {
      console.error('❌ [ADMIN-EMAIL-API] Error sending daily summary:', error);
      set.status = 500;
      return { error: 'Failed to send daily summary', details: error.message };
    }
  })

  // ตรวจสอบการแจ้งเตือนด่วนทันที
  .post('/check-urgent-alerts', async ({ headers, set }) => {
    try {
      const user = await requireAdmin({ headers, set });
      if (user.error) return user;

      console.log('🚨 [ADMIN-EMAIL-API] Manual urgent check request by admin:', user.email);
      
      await checkUrgentAlerts();
      
      return {
        success: true,
        message: 'Urgent alerts check completed'
      };
    } catch (error) {
      console.error('❌ [ADMIN-EMAIL-API] Error checking urgent alerts:', error);
      set.status = 500;
      return { error: 'Failed to check urgent alerts', details: error.message };
    }
  })

  // ดูสถิติการส่งอีเมลแจ้งเตือน
  .get('/statistics', async ({ headers, set, query }) => {
    try {
      const user = await requireAdmin({ headers, set });
      if (user.error) return user;

      const { days = 7 } = query;
      const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      console.log(`📊 [ADMIN-EMAIL-API] Email statistics request for last ${days} days`);

      // สถิติการจองในช่วงที่เลือก
      const bookingStats = await sql`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COUNT(CASE WHEN payment_receipt_url IS NOT NULL THEN 1 END) as bookings_with_payment,
          COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_price END), 0) as total_revenue
        FROM bookings 
        WHERE created_at >= ${daysAgo.toISOString()}
      `;

      // จำนวนแอดมินในระบบ
      const adminCount = await sql`
        SELECT COUNT(*) as count
        FROM users 
        WHERE role = 'admin' AND email IS NOT NULL
      `;

      const stats = {
        period: `${days} วันที่ผ่านมา`,
        adminCount: parseInt(adminCount[0].count),
        bookings: {
          total: parseInt(bookingStats[0].total_bookings),
          pending: parseInt(bookingStats[0].pending_bookings),
          confirmed: parseInt(bookingStats[0].confirmed_bookings),
          cancelled: parseInt(bookingStats[0].cancelled_bookings),
          withPayment: parseInt(bookingStats[0].bookings_with_payment)
        },
        revenue: parseFloat(bookingStats[0].total_revenue),
        estimatedEmailsSent: {
          newBookingNotifications: parseInt(bookingStats[0].total_bookings) * parseInt(adminCount[0].count),
          paymentNotifications: parseInt(bookingStats[0].bookings_with_payment) * parseInt(adminCount[0].count),
          cancellationNotifications: parseInt(bookingStats[0].cancelled_bookings) * parseInt(adminCount[0].count)
        }
      };

      return {
        success: true,
        statistics: stats
      };
    } catch (error) {
      console.error('❌ [ADMIN-EMAIL-API] Error fetching email statistics:', error);
      set.status = 500;
      return { error: 'Failed to fetch statistics', details: error.message };
    }
  })

  // ทดสอบส่งอีเมลแจ้งเตือน
  .post('/test-notification', async ({ headers, set, body }) => {
    try {
      const user = await requireAdmin({ headers, set });
      if (user.error) return user;

      const { type, testEmail } = body;
      const targetEmail = testEmail || user.email;

      console.log(`🧪 [ADMIN-EMAIL-API] Test notification request - Type: ${type}, Target: ${targetEmail}`);

      // สร้างข้อมูลทดสอบ
      const testBookingData = {
        id: 'TEST-123',
        bookingReference: 'BK-TEST-123',
        hotel_name: 'โรงแรมทดสอบ',
        room_type_name: 'ห้องทดสอบ',
        check_in_date: new Date().toISOString(),
        check_out_date: new Date(Date.now() + 86400000).toISOString(),
        guests: 2,
        total_price: 1500
      };

      const testUserData = {
        first_name: 'ลูกค้า',
        last_name: 'ทดสอบ',
        email: 'customer@test.com'
      };

      let result;
      switch (type) {
        case 'new_booking':
          result = await automaticAdminEmailNotifications.onNewBooking(testBookingData, testUserData);
          break;
        case 'payment_received':
          result = await automaticAdminEmailNotifications.onPaymentReceived(testBookingData, testUserData);
          break;
        case 'booking_cancelled':
          result = await automaticAdminEmailNotifications.onBookingCancelled(testBookingData, testUserData, 'ทดสอบระบบ');
          break;
        default:
          set.status = 400;
          return { error: 'Invalid notification type. Use: new_booking, payment_received, or booking_cancelled' };
      }

      return {
        success: true,
        message: `Test ${type} notification sent successfully`,
        target: targetEmail
      };
    } catch (error) {
      console.error('❌ [ADMIN-EMAIL-API] Error sending test notification:', error);
      set.status = 500;
      return { error: 'Failed to send test notification', details: error.message };
    }
  })

  // ดูรายชื่อแอดมินที่จะได้รับการแจ้งเตือน
  .get('/admin-list', async ({ headers, set }) => {
    try {
      const user = await requireAdmin({ headers, set });
      if (user.error) return user;

      const admins = await sql`
        SELECT id, email, first_name, last_name, created_at
        FROM users 
        WHERE role = 'admin' AND email IS NOT NULL
        ORDER BY created_at DESC
      `;

      return {
        success: true,
        admins: admins.map(admin => ({
          id: admin.id,
          email: admin.email,
          name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'ไม่ระบุชื่อ',
          createdAt: admin.created_at
        })),
        total: admins.length
      };
    } catch (error) {
      console.error('❌ [ADMIN-EMAIL-API] Error fetching admin list:', error);
      set.status = 500;
      return { error: 'Failed to fetch admin list', details: error.message };
    }
  })

  // อัพเดตการตั้งค่าการแจ้งเตือน
  .put('/settings', async ({ headers, set, body }) => {
    try {
      const user = await requireAdmin({ headers, set });
      if (user.error) return user;

      const { 
        dailySummaryEnabled = true,
        dailySummaryTime = '20:00',
        urgentAlertsEnabled = true,
        urgentAlertsThreshold = 5
      } = body;

      // ในการใช้งานจริงควรเก็บการตั้งค่าในฐานข้อมูล
      console.log('⚙️ [ADMIN-EMAIL-API] Email notification settings updated:', {
        dailySummaryEnabled,
        dailySummaryTime,
        urgentAlertsEnabled,
        urgentAlertsThreshold,
        updatedBy: user.email
      });

      return {
        success: true,
        message: 'Email notification settings updated successfully',
        settings: {
          dailySummaryEnabled,
          dailySummaryTime,
          urgentAlertsEnabled,
          urgentAlertsThreshold
        }
      };
    } catch (error) {
      console.error('❌ [ADMIN-EMAIL-API] Error updating settings:', error);
      set.status = 500;
      return { error: 'Failed to update settings', details: error.message };
    }
  })

  // ดูการตั้งค่าปัจจุบัน
  .get('/settings', async ({ headers, set }) => {
    try {
      const user = await requireAdmin({ headers, set });
      if (user.error) return user;

      // ในการใช้งานจริงควรดึงจากฐานข้อมูล
      const settings = {
        dailySummaryEnabled: true,
        dailySummaryTime: '20:00',
        urgentAlertsEnabled: true,
        urgentAlertsThreshold: 5
      };

      return {
        success: true,
        settings: settings
      };
    } catch (error) {
      console.error('❌ [ADMIN-EMAIL-API] Error fetching settings:', error);
      set.status = 500;
      return { error: 'Failed to fetch settings', details: error.message };
    }
  });

console.log('✅ [ADMIN-EMAIL-ROUTES] Admin email notification routes loaded successfully');