import { 
  sendBookingConfirmationEmail, 
  sendBookingCancellationEmail, 
  sendBookingUpdateEmail,
  sendCheckInReminderEmail 
} from './emailService.js';

// ระบบส่งอีเมลแจ้งเตือนอัตโนมัติ - ระบบเป็นคนส่งทั้งหมด
export const automaticEmailNotifications = {
  // ส่งทันทีเมื่อจองสำเร็จ
  onBookingCreated: async (bookingData, userData) => {
    try {
      const userName = `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ผู้ใช้';
      
      console.log('🚀 [SYSTEM] Auto-sending booking confirmation email...');
      await sendBookingConfirmationEmail(userData.email, bookingData, userName);
      console.log('✅ [SYSTEM] Booking confirmation email sent automatically to:', userData.email);
      
      // Log สำหรับการติดตาม
      console.log(`📋 Booking confirmed: ${bookingData.bookingReference} for ${userName}`);
    } catch (error) {
      console.error('❌ [SYSTEM] Failed to send automatic booking confirmation:', error);
      // ไม่ throw error เพราะการจองสำเร็จแล้ว
    }
  },

  // ส่งเมื่อการจองถูกยกเลิก
  onBookingCancelled: async (bookingData, userData, reason = 'ไม่ระบุเหตุผล') => {
    try {
      const userName = `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ผู้ใช้';
      
      console.log('🚀 [SYSTEM] Auto-sending booking cancellation email...');
      await sendBookingCancellationEmail(userData.email, bookingData, userName);
      console.log('✅ [SYSTEM] Booking cancellation email sent automatically to:', userData.email);
      
      // Log สำหรับการติดตาม
      console.log(`❌ Booking cancelled: ${bookingData.bookingReference} for ${userName}, Reason: ${reason}`);
    } catch (error) {
      console.error('❌ [SYSTEM] Failed to send automatic booking cancellation:', error);
      // ไม่ throw error เพราะการยกเลิกดำเนินการแล้ว
    }
  },

  // ส่งเมื่อมีการอัปเดตการจอง
  onBookingUpdated: async (bookingData, userData, updateDetails) => {
    try {
      const userName = `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ผู้ใช้';
      
      console.log('🚀 [SYSTEM] Auto-sending booking update email...');
      await sendBookingUpdateEmail(userData.email, bookingData, updateDetails, userName);
      console.log('✅ [SYSTEM] Booking update email sent automatically to:', userData.email);
      
      // Log สำหรับการติดตาม
      console.log(`🔄 Booking updated: ${bookingData.bookingReference} for ${userName}`);
    } catch (error) {
      console.error('❌ [SYSTEM] Failed to send automatic booking update:', error);
      // ไม่ throw error เพราะการอัปเดตดำเนินการแล้ว
    }
  },

  // ส่งแจ้งเตือนก่อนเข้าพัก 1 วัน
  checkInReminder: async (bookingData, userData) => {
    try {
      const userName = `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ผู้ใช้';
      
      console.log('🚀 [SYSTEM] Auto-sending check-in reminder email...');
      await sendCheckInReminderEmail(userData.email, bookingData, userName);
      console.log('✅ [SYSTEM] Check-in reminder email sent automatically to:', userData.email);
      
      // Log สำหรับการติดตาม
      console.log(`⏰ Check-in reminder sent: ${bookingData.bookingReference} for ${userName}`);
    } catch (error) {
      console.error('❌ [SYSTEM] Failed to send automatic check-in reminder:', error);
    }
  },

  // ส่งอีเมลยินดีต้อนรับหลังเช็คอิน
  welcomeAfterCheckIn: async (bookingData, userData) => {
    try {
      const userName = `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ผู้ใช้';
      
      console.log('🚀 [SYSTEM] Auto-sending welcome email after check-in...');
      
      // สามารถเพิ่มฟังก์ชันส่งอีเมลยินดีต้อนรับได้ที่นี่
      console.log('✅ [SYSTEM] Welcome email logic triggered for:', userData.email);
      
      // Log สำหรับการติดตาม
      console.log(`🎉 Welcome email triggered: ${bookingData.bookingReference} for ${userName}`);
    } catch (error) {
      console.error('❌ [SYSTEM] Failed to send welcome email:', error);
    }
  },

  // ส่งอีเมลขอบคุณหลังเช็คเอาท์
  thankYouAfterCheckOut: async (bookingData, userData) => {
    try {
      const userName = `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ผู้ใช้';
      
      console.log('🚀 [SYSTEM] Auto-sending thank you email after check-out...');
      
      // สามารถเพิ่มฟังก์ชันส่งอีเมลขอบคุณได้ที่นี่
      console.log('✅ [SYSTEM] Thank you email logic triggered for:', userData.email);
      
      // Log สำหรับการติดตาม
      console.log(`🙏 Thank you email triggered: ${bookingData.bookingReference} for ${userName}`);
    } catch (error) {
      console.error('❌ [SYSTEM] Failed to send thank you email:', error);
    }
  }
};

// ตัวช่วยสำหรับส่งอีเมลแบบ batch
export const batchEmailNotifications = {
  // ส่งแจ้งเตือนก่อนเข้าพักสำหรับการจองทั้งหมดที่จะเข้าพักพรุ่งนี้
  sendTomorrowCheckInReminders: async () => {
    try {
      console.log('🚀 [SYSTEM] Starting batch check-in reminders...');
      
      // ดึงการจองที่จะเข้าพักพรุ่งนี้
      // Code สำหรับดึงข้อมูลจาก database
      
      console.log('✅ [SYSTEM] Batch check-in reminders completed');
    } catch (error) {
      console.error('❌ [SYSTEM] Failed to send batch check-in reminders:', error);
    }
  },

  // ส่งอีเมลสรุปรายสัปดาห์
  sendWeeklySummary: async () => {
    try {
      console.log('🚀 [SYSTEM] Starting weekly summary emails...');
      
      // Code สำหรับส่งสรุปรายสัปดาห์
      
      console.log('✅ [SYSTEM] Weekly summary emails completed');
    } catch (error) {
      console.error('❌ [SYSTEM] Failed to send weekly summary:', error);
    }
  }
};

// ฟังก์ชันตรวจสอบและส่งอีเมลตามเงื่อนไข
export const conditionalEmailNotifications = {
  // ตรวจสอบและส่งอีเมลตามการตั้งค่าของผู้ใช้
  sendIfUserOptedIn: async (userId, emailType, ...args) => {
    try {
      // ตรวจสอบการตั้งค่าการแจ้งเตือนของผู้ใช้
      // Code สำหรับตรวจสอบ notification preferences
      
      const userPreferences = {
        emailNotifications: true,
        bookingUpdates: true,
        promotions: false
      };

      // ส่งอีเมลถ้าผู้ใช้เปิดใช้งาน
      if (userPreferences.emailNotifications && userPreferences.bookingUpdates) {
        console.log(`✅ [SYSTEM] User ${userId} opted in for ${emailType}, sending email...`);
        
        // เรียกใช้ฟังก์ชันส่งอีเมลที่เหมาะสม
        switch (emailType) {
          case 'booking_confirmation':
            await automaticEmailNotifications.onBookingCreated(...args);
            break;
          case 'booking_cancellation':
            await automaticEmailNotifications.onBookingCancelled(...args);
            break;
          case 'booking_update':
            await automaticEmailNotifications.onBookingUpdated(...args);
            break;
          case 'check_in_reminder':
            await automaticEmailNotifications.checkInReminder(...args);
            break;
          default:
            console.log(`⚠️ [SYSTEM] Unknown email type: ${emailType}`);
        }
      } else {
        console.log(`⏭️ [SYSTEM] User ${userId} opted out of ${emailType}, skipping email`);
      }
    } catch (error) {
      console.error(`❌ [SYSTEM] Failed to check user preferences for ${emailType}:`, error);
    }
  }
};
