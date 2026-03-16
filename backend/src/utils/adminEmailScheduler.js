import { automaticAdminEmailNotifications, sendDailyAdminSummaryEmail } from './email/adminEmailService.js';
import { sql } from '../db/database.js';

/**
 * ระบบส่งอีเมลสรุปประจำวันให้แอดมิน
 * จะถูกเรียกใช้โดย Cron Job หรือ Task Scheduler
 */
export class AdminEmailScheduler {
  constructor() {
    this.isRunning = false;
  }

  /**
   * ส่งอีเมลสรุปประจำวันให้แอดมินทุกคน
   */
  async sendDailySummary() {
    if (this.isRunning) {
      console.log('📧 [ADMIN-SCHEDULER] Daily summary already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('📧 [ADMIN-SCHEDULER] Starting daily summary email process...');

    try {
      // ดึงข้อมูลสถิติวันนี้
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      console.log('📊 [ADMIN-SCHEDULER] Fetching today\'s statistics...');
      
      // การจองใหม่วันนี้
      const newBookingsResult = await sql`
        SELECT COUNT(*) as count
        FROM bookings 
        WHERE created_at >= ${todayStart.toISOString()} 
        AND created_at < ${todayEnd.toISOString()}
      `;

      // การจองที่เสร็จสิ้นวันนี้ (check-out วันนี้)
      const completedBookingsResult = await sql`
        SELECT COUNT(*) as count
        FROM bookings 
        WHERE DATE(check_out_date) = DATE(${today.toISOString()})
        AND status = 'confirmed'
      `;

      // การจองที่รอการอนุมัติ
      const pendingApprovalsResult = await sql`
        SELECT COUNT(*) as count
        FROM bookings 
        WHERE status = 'pending'
      `;

      // รายได้รวมจากการจองที่ยืนยันแล้ววันนี้
      const revenueResult = await sql`
        SELECT COALESCE(SUM(total_price), 0) as total
        FROM bookings 
        WHERE status = 'confirmed'
        AND created_at >= ${todayStart.toISOString()} 
        AND created_at < ${todayEnd.toISOString()}
      `;

      // การจองที่ถูกยกเลิกวันนี้
      const cancelledBookingsResult = await sql`
        SELECT COUNT(*) as count
        FROM bookings 
        WHERE status = 'cancelled'
        AND updated_at >= ${todayStart.toISOString()} 
        AND updated_at < ${todayEnd.toISOString()}
      `;

      // การอัปโหลดสลิปการชำระเงินวันนี้
      const paymentSlipsResult = await sql`
        SELECT COUNT(*) as count
        FROM bookings 
        WHERE payment_receipt_url IS NOT NULL
        AND updated_at >= ${todayStart.toISOString()} 
        AND updated_at < ${todayEnd.toISOString()}
      `;

      const summaryData = {
        newBookings: parseInt(newBookingsResult[0].count),
        completedBookings: parseInt(completedBookingsResult[0].count),
        pendingApprovals: parseInt(pendingApprovalsResult[0].count),
        totalRevenue: parseFloat(revenueResult[0].total),
        cancelledBookings: parseInt(cancelledBookingsResult[0].count),
        paymentSlipsUploaded: parseInt(paymentSlipsResult[0].count),
        date: today.toLocaleDateString('th-TH')
      };

      console.log('📊 [ADMIN-SCHEDULER] Daily summary data:', summaryData);

      // ดึงรายชื่อแอดมินทั้งหมด
      const admins = await sql`
        SELECT email, first_name, last_name 
        FROM users 
        WHERE role = 'admin' AND email IS NOT NULL
      `;

      console.log(`📧 [ADMIN-SCHEDULER] Sending daily summary to ${admins.length} admin(s)...`);

      // ส่งอีเมลให้แอดมินทุกคน
      let successCount = 0;
      for (const admin of admins) {
        try {
          await sendDailyAdminSummaryEmail(admin.email, summaryData);
          successCount++;
          console.log(`✅ [ADMIN-SCHEDULER] Daily summary sent to: ${admin.email}`);
        } catch (emailError) {
          console.error(`❌ [ADMIN-SCHEDULER] Failed to send daily summary to ${admin.email}:`, emailError);
        }
      }

      console.log(`📧 [ADMIN-SCHEDULER] Daily summary process completed. Success: ${successCount}/${admins.length}`);
      
      return {
        success: true,
        sent: successCount,
        total: admins.length,
        data: summaryData
      };

    } catch (error) {
      console.error('❌ [ADMIN-SCHEDULER] Error in daily summary process:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * ส่งแจ้งเตือนการจองด่วน (มีการจองใหม่มากในช่วงเวลาสั้น)
   */
  async sendUrgentBookingAlert() {
    try {
      console.log('🚨 [ADMIN-SCHEDULER] Checking for urgent booking alerts...');

      // ตรวจสอบการจองใหม่ในช่วง 1 ชั่วโมงที่ผ่านมา
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentBookings = await sql`
        SELECT COUNT(*) as count
        FROM bookings 
        WHERE created_at >= ${oneHourAgo.toISOString()}
        AND status = 'pending'
      `;

      const recentCount = parseInt(recentBookings[0].count);
      
      // ถ้ามีการจองใหม่มากกว่า 5 รายการใน 1 ชั่วโมง ให้แจ้งเตือน
      if (recentCount >= 5) {
        console.log(`🚨 [ADMIN-SCHEDULER] Urgent alert: ${recentCount} new bookings in the last hour!`);

        const admins = await sql`
          SELECT email, first_name, last_name 
          FROM users 
          WHERE role = 'admin' AND email IS NOT NULL
        `;

        for (const admin of admins) {
          try {
            const urgentEmailData = {
              newBookingsCount: recentCount,
              timeFrame: '1 ชั่วโมงที่ผ่านมา',
              alertLevel: 'HIGH'
            };

            // สามารถสร้าง template สำหรับการแจ้งเตือนด่วนได้
            console.log(`🚨 [ADMIN-SCHEDULER] Sending urgent alert to: ${admin.email}`);
            
            // TODO: สร้าง template สำหรับ urgent alert
            // await sendUrgentBookingAlertEmail(admin.email, urgentEmailData);
            
          } catch (error) {
            console.error(`❌ [ADMIN-SCHEDULER] Failed to send urgent alert to ${admin.email}:`, error);
          }
        }
      } else {
        console.log(`📊 [ADMIN-SCHEDULER] No urgent booking alert needed. Recent bookings: ${recentCount}`);
      }

    } catch (error) {
      console.error('❌ [ADMIN-SCHEDULER] Error checking urgent booking alerts:', error);
    }
  }

  /**
   * เริ่มต้น Cron Jobs สำหรับการส่งอีเมลอัตโนมัติ
   */
  startScheduledTasks() {
    console.log('🕐 [ADMIN-SCHEDULER] Starting scheduled email tasks...');

    // ส่งอีเมลสรุปประจำวันทุกวันเวลา 20:00
    // (ในการใช้งานจริงควรใช้ cron library เช่น node-cron)
    const dailySummaryInterval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      // ส่งเวลา 20:00 น.
      if (hour === 20 && minute === 0) {
        this.sendDailySummary().catch(error => {
          console.error('❌ [ADMIN-SCHEDULER] Scheduled daily summary failed:', error);
        });
      }
    }, 60000); // ตรวจสอบทุกนาที

    // ตรวจสอบการจองด่วนทุก 30 นาที
    const urgentCheckInterval = setInterval(() => {
      this.sendUrgentBookingAlert().catch(error => {
        console.error('❌ [ADMIN-SCHEDULER] Scheduled urgent check failed:', error);
      });
    }, 30 * 60 * 1000); // ทุก 30 นาที

    console.log('✅ [ADMIN-SCHEDULER] Scheduled tasks started successfully');

    return {
      dailySummaryInterval,
      urgentCheckInterval
    };
  }

  /**
   * หยุด Scheduled Tasks
   */
  stopScheduledTasks(intervals) {
    if (intervals.dailySummaryInterval) {
      clearInterval(intervals.dailySummaryInterval);
    }
    if (intervals.urgentCheckInterval) {
      clearInterval(intervals.urgentCheckInterval);
    }
    console.log('🛑 [ADMIN-SCHEDULER] Scheduled tasks stopped');
  }
}

// Export singleton instance
export const adminEmailScheduler = new AdminEmailScheduler();

// Export convenience functions
export const sendDailySummaryNow = () => adminEmailScheduler.sendDailySummary();
export const checkUrgentAlerts = () => adminEmailScheduler.sendUrgentBookingAlert();