import cron from 'node-cron';
import { sql } from '../../db/database.js';
import { automaticEmailNotifications } from '../email/automaticEmailService.js';

// ระบบงานตามกำหนดเวลา (Cron Jobs) สำหรับการแจ้งเตือน
export class NotificationScheduler {
  constructor() {
    this.jobs = new Map();
    this.initializeJobs();
  }

  // เริ่มต้นงานทั้งหมด
  initializeJobs() {
    console.log('🕐 Initializing notification scheduler jobs...');
    
    // แจ้งเตือนก่อนเข้าพัก 1 วัน (ทำงานทุกวันเวลา 09:00)
    this.scheduleCheckInReminders();
    
    // ตรวจสอบการจองที่หมดอายุ (ทำงานทุกชั่วโมง)
    this.scheduleExpiredBookingCheck();
    
    // ส่งสรุปประจำวันให้แอดมิน (ทำงานทุกวันเวลา 18:00)
    this.scheduleDailySummary();
    
    console.log('✅ All notification scheduler jobs initialized');
  }

  // แจ้งเตือนก่อนเข้าพัก 1 วัน
  scheduleCheckInReminders() {
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running check-in reminder job...');
      
      try {
        // หาการจองที่จะเข้าพักพรุ่งนี้
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const nextDay = new Date(tomorrow);
        nextDay.setDate(nextDay.getDate() + 1);

        const upcomingBookings = await sql`
          SELECT 
            b.*,
            u.email, u.first_name, u.last_name, u.phone,
            h.name as hotel_name,
            rt.name as room_type_name
          FROM bookings b
          JOIN users u ON b.user_id = u.id
          LEFT JOIN room_types rt ON b.room_type_id = rt.id
          LEFT JOIN hotels h ON rt.hotel_id = h.id
          WHERE b.check_in_date >= ${tomorrow.toISOString().split('T')[0]}
            AND b.check_in_date < ${nextDay.toISOString().split('T')[0]}
            AND b.status IN ('confirmed', 'completed')
        `;

        console.log(`📋 Found ${upcomingBookings.length} bookings for tomorrow check-in reminders`);

        // ส่งอีเมลแจ้งเตือนแต่ละการจอง
        for (const booking of upcomingBookings) {
          try {
            const userData = {
              email: booking.email,
              first_name: booking.first_name,
              last_name: booking.last_name,
              firstName: booking.first_name,
              lastName: booking.last_name,
              phone: booking.phone
            };

            const bookingData = {
              id: booking.id,
              booking_reference: booking.booking_reference,
              hotel_name: booking.hotel_name,
              room_type_name: booking.room_type_name,
              check_in_date: booking.check_in_date,
              check_out_date: booking.check_out_date,
              guests: booking.guests,
              total_price: booking.total_price
            };

            // ส่งแจ้งเตือนก่อนเข้าพัก
            await automaticEmailNotifications.checkInReminder(bookingData, userData);
            
            console.log(`✅ Check-in reminder sent for booking ${booking.booking_reference}`);
          } catch (emailError) {
            console.error(`❌ Failed to send check-in reminder for booking ${booking.id}:`, emailError);
          }
        }

        console.log('✅ Check-in reminder job completed');
      } catch (error) {
        console.error('❌ Error in check-in reminder job:', error);
      }
    }, {
      timezone: 'Asia/Bangkok'
    });

    this.jobs.set('checkInReminders', job);
    console.log('✅ Check-in reminder job scheduled (daily at 09:00)');
  }

  // ตรวจสอบการจองที่หมดอายุ
  scheduleExpiredBookingCheck() {
    const job = cron.schedule('0 * * * *', async () => {
      console.log('🔍 Running expired booking check...');
      
      try {
        const now = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // หาการจองที่หมดอายุ (ผ่านวันเข้าพักแล้วแต่ยังไม่ได้ยกเลิก)
        const expiredBookings = await sql`
          UPDATE bookings 
          SET status = 'expired', updated_at = CURRENT_TIMESTAMP
          WHERE check_in_date < ${yesterday.toISOString().split('T')[0]}
            AND status = 'pending'
          RETURNING *
        `;

        if (expiredBookings.length > 0) {
          console.log(`📋 Found and updated ${expiredBookings.length} expired bookings`);
          
          // TODO: ส่งแจ้งเตือนให้แอดมินเกี่ยวกับการจองที่หมดอายุ
        }

        console.log('✅ Expired booking check completed');
      } catch (error) {
        console.error('❌ Error in expired booking check:', error);
      }
    }, {
      timezone: 'Asia/Bangkok'
    });

    this.jobs.set('expiredBookingCheck', job);
    console.log('✅ Expired booking check scheduled (hourly)');
  }

  // ส่งสรุปประจำวันให้แอดมิน
  scheduleDailySummary() {
    const job = cron.schedule('0 18 * * *', async () => {
      console.log('📊 Running daily summary job...');
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // ดึงข้อมูลสถิติประจำวัน
        const [newBookings] = await sql`
          SELECT COUNT(*) as count
          FROM bookings 
          WHERE created_at >= ${today.toISOString()}
            AND created_at < ${tomorrow.toISOString()}
        `;

        const [completedBookings] = await sql`
          SELECT COUNT(*) as count
          FROM bookings 
          WHERE status = 'completed'
            AND updated_at >= ${today.toISOString()}
            AND updated_at < ${tomorrow.toISOString()}
        `;

        const [pendingApprovals] = await sql`
          SELECT COUNT(*) as count
          FROM bookings 
          WHERE status = 'pending'
        `;

        const [totalRevenue] = await sql`
          SELECT COALESCE(SUM(total_price), 0) as revenue
          FROM bookings 
          WHERE status = 'completed'
            AND updated_at >= ${today.toISOString()}
            AND updated_at < ${tomorrow.toISOString()}
        `;

        const summaryData = {
          newBookings: parseInt(newBookings.count),
          completedBookings: parseInt(completedBookings.count),
          pendingApprovals: parseInt(pendingApprovals.count),
          totalRevenue: parseFloat(totalRevenue.revenue)
        };

        // ส่งอีเมลสรุปให้แอดมิน
        const { sendDailyAdminSummaryEmail } = await import('../email/adminEmailService.js');
        const admins = await sql`
          SELECT email 
          FROM users 
          WHERE role = 'admin' AND email IS NOT NULL
        `;

        for (const admin of admins) {
          try {
            await sendDailyAdminSummaryEmail(admin.email, summaryData);
            console.log(`✅ Daily summary sent to admin: ${admin.email}`);
          } catch (emailError) {
            console.error(`❌ Failed to send daily summary to ${admin.email}:`, emailError);
          }
        }

        console.log('✅ Daily summary job completed');
      } catch (error) {
        console.error('❌ Error in daily summary job:', error);
      }
    }, {
      timezone: 'Asia/Bangkok'
    });

    this.jobs.set('dailySummary', job);
    console.log('✅ Daily summary job scheduled (daily at 18:00)');
  }

  // เริ่มงานทั้งหมด
  startAll() {
    console.log('🚀 Starting all notification scheduler jobs...');
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`✅ ${name} job started`);
    });
    console.log('✅ All notification scheduler jobs are now running');
  }

  // หยุดงานทั้งหมด
  stopAll() {
    console.log('🛑 Stopping all notification scheduler jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`🛑 ${name} job stopped`);
    });
    console.log('🛑 All notification scheduler jobs stopped');
  }

  // หยุดงานเฉพาะ
  stopJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      console.log(`🛑 ${name} job stopped`);
    }
  }

  // เริ่มงานเฉพาะ
  startJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.start();
      console.log(`🚀 ${name} job started`);
    }
  }

  // ดูสถานะงาน
  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running || false,
        scheduled: !!job.scheduled
      };
    });
    return status;
  }

  // รันงานทันที (สำหรับการทดสอบ)
  async runJobNow(jobName) {
    console.log(`🧪 Running ${jobName} job manually for testing...`);
    
    switch (jobName) {
      case 'checkInReminders':
        // รันแจ้งเตือนก่อนเข้าพักทันที
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        // ใส่โค้ดจาก scheduleCheckInReminders ที่นี่
        break;
        
      case 'expiredBookingCheck':
        // รันตรวจสอบการจองหมดอายุทันที
        // ใส่โค้ดจาก scheduleExpiredBookingCheck ที่นี่
        break;
        
      case 'dailySummary':
        // รันสรุปประจำวันทันที
        // ใส่โค้ดจาก scheduleDailySummary ที่นี่
        break;
        
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

// สร้าง instance เดียวสำหรับทั้งแอป
export const notificationScheduler = new NotificationScheduler();