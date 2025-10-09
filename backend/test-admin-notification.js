// ทดสอบระบบแจ้งเตือนแอดมิน
import { automaticAdminEmailNotifications } from './src/utils/adminEmailService.js';

async function testAdminNotification() {
  try {
    console.log('🧪 Testing admin notification system...');
    
    // ข้อมูลการจองตัวอย่าง
    const testBookingData = {
      id: 999,
      booking_reference: 'TEST-BK999',
      hotel_name: 'Test Hotel',
      room_type_name: 'Deluxe Room',
      check_in_date: '2025-10-10',
      check_out_date: '2025-10-12',
      guests: 2,
      total_price: 2500,
      special_requests: 'Test booking for admin notification'
    };
    
    const testUserData = {
      email: 'testuser@test.com',
      first_name: 'ลูกค้า',
      last_name: 'ทดสอบ'
    };
    
    console.log('📧 Sending test admin notification...');
    await automaticAdminEmailNotifications.onNewBooking(testBookingData, testUserData);
    
    console.log('✅ Test notification sent successfully!');
    console.log('📬 Please check admin emails:');
    console.log('   - admin@royalgarden.com');
    console.log('   - admin@test.com');
    
  } catch (error) {
    console.error('❌ Error testing admin notification:', error);
  }
  
  process.exit(0);
}

testAdminNotification();