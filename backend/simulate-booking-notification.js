// ทดสอบการจองจริงเพื่อดูการแจ้งเตือนแอดมิน
import { sql } from './src/db/database.js';
import { automaticAdminEmailNotifications } from './src/utils/adminEmailService.js';
import { notificationService } from './src/utils/notificationService.js';

async function simulateBookingCreation() {
  try {
    console.log('🧪 Simulating a real booking creation...');
    
    // สร้างข้อมูลการจองเหมือนจริง
    const newBookingId = Math.floor(Math.random() * 1000) + 500;
    const bookingReference = `TEST-${newBookingId}`;
    
    const bookingData = {
      id: newBookingId,
      bookingReference: bookingReference,
      hotelName: 'โรงแรมทดสอบ',
      roomTypeName: 'ห้องดีลักซ์',
      roomNumber: '101',
      floor: '1',
      bedType: 'เตียงใหญ่',
      pricePerNight: 1200,
      nights: 2,
      checkInDate: '2025-10-10',
      checkOutDate: '2025-10-12',
      guests: 2,
      maxGuests: 4,
      totalPrice: 2400,
      status: 'pending',
      specialRequests: 'ขอห้องวิวสวน'
    };
    
    const userData = {
      email: 'testcustomer@test.com',
      first_name: 'ลูกค้า',
      last_name: 'ทดสอบระบบ'
    };
    
    console.log('\n📧 Step 1: Sending customer email notification...');
    // ส่งอีเมลให้ลูกค้า (แบบเดิม)
    const { automaticEmailNotifications } = await import('./src/utils/automaticEmailService.js');
    try {
      await automaticEmailNotifications.onBookingCreated(bookingData, userData);
      console.log('✅ Customer email sent successfully');
    } catch (error) {
      console.error('❌ Customer email failed:', error.message);
    }
    
    console.log('\n🔔 Step 2: Sending admin notifications...');
    
    // ส่งการแจ้งเตือนแอดมิน (ใหม่)
    const notificationServiceInstance = new notificationService.constructor();
    
    try {
      await notificationServiceInstance.notifyAdmins('new_booking', {
        bookingId: newBookingId,
        customerName: `${userData.first_name} ${userData.last_name}`,
        hotelName: bookingData.hotelName,
        amount: bookingData.totalPrice,
        booking: bookingData,
        user: userData
      });
      console.log('✅ Admin notifications sent successfully');
    } catch (error) {
      console.error('❌ Admin notifications failed:', error.message);
    }
    
    console.log('\n📬 Expected results:');
    console.log('1. Customer should receive booking confirmation email');
    console.log('2. All admins should receive new booking notification:');
    console.log('   - admin@royalgarden.com');
    console.log('   - admin@test.com');
    console.log('\n🎯 Check both customer and admin inboxes!');
    
  } catch (error) {
    console.error('❌ Simulation failed:', error);
  }
  
  process.exit(0);
}

simulateBookingCreation();