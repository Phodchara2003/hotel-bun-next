import { automaticEmailNotifications } from './src/utils/automaticEmailService.js';

const testAutomaticEmailSystem = async () => {
  console.log('🧪 Testing Automatic Email Notification System...\n');

  // ข้อมูลทดสอบ
  const testUserData = {
    email: 'test@example.com', // เปลี่ยนเป็นอีเมลของคุณ
    first_name: 'ทดสอบ',
    last_name: 'ระบบอัตโนมัติ'
  };
  
  const testBookingData = {
    bookingReference: 'AUTO-TEST-001',
    hotelName: 'Grand Hotel Bangkok (Auto System)',  
    roomTypeName: 'Superior Double Room',
    checkInDate: '2025-02-15',
    checkOutDate: '2025-02-17',
    guests: 2,
    totalPrice: 4500,
    status: 'confirmed',
    specialRequests: 'ทดสอบระบบส่งอีเมลอัตโนมัติ'
  };

  try {
    console.log('📧 [SYSTEM AUTO] ระบบกำลังส่งอีเมลอัตโนมัติ...\n');

    // 1. ทดสอบการส่งอีเมลยืนยันการจอง
    console.log('1️⃣ [AUTO] Testing Booking Confirmation (System Sends Automatically)...');
    await automaticEmailNotifications.onBookingCreated(testBookingData, testUserData);
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // รอ 3 วินาที
    
    // 2. ทดสอบการส่งอีเมลการยกเลิก
    console.log('\n2️⃣ [AUTO] Testing Booking Cancellation (System Sends Automatically)...');
    await automaticEmailNotifications.onBookingCancelled(
      testBookingData, 
      testUserData, 
      'ทดสอบระบบยกเลิกอัตโนมัติ'
    );
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // รอ 3 วินาที
    
    // 3. ทดสอบการส่งอีเมลการอัปเดต
    console.log('\n3️⃣ [AUTO] Testing Booking Update (System Sends Automatically)...');
    const updateDetails = 'ระบบได้อัปเดตข้อมูลการจองโดยอัตโนมัติ - เปลี่ยนแปลงห้องจาก Standard เป็น Superior เนื่องจากมีห้องว่าง';
    await automaticEmailNotifications.onBookingUpdated(
      testBookingData, 
      testUserData, 
      updateDetails
    );
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // รอ 3 วินาที
    
    // 4. ทดสอบการส่งอีเมลแจ้งเตือนก่อนเข้าพัก
    console.log('\n4️⃣ [AUTO] Testing Check-in Reminder (System Sends Automatically)...');
    await automaticEmailNotifications.checkInReminder(testBookingData, testUserData);
    
    console.log('\n✅ [SYSTEM AUTO] All automatic email tests completed!');
    console.log('📧 ระบบได้ส่งอีเมลทั้งหมดโดยอัตโนมัติแล้ว');
    console.log('🎯 ข้อดี: ไม่ต้องรอแอดมินส่ง, ส่งทันทีตามเหตุการณ์');
    console.log('⚡ ระบบทำงาง: Background processing, ไม่บล็อคการทำงานหลัก');
    
    console.log('\n📋 สรุปการทำงาน:');
    console.log('   ✅ จองสำเร็จ → ส่งอีเมลยืนยันทันที');
    console.log('   ✅ ยกเลิกการจอง → ส่งอีเมลแจ้งเตือนทันที');  
    console.log('   ✅ อัปเดตข้อมูล → ส่งอีเมลแจ้งการเปลี่ยนแปลงทันที');
    console.log('   ✅ ก่อนเข้าพัก → ส่งอีเมลเตือนทันที');
    
  } catch (error) {
    console.error('❌ [SYSTEM AUTO] Email test failed:', error);
    console.error('📝 ตรวจสอบการตั้งค่า:');
    console.error('   - GMAIL_USER environment variable');
    console.error('   - GMAIL_APP_PASSWORD environment variable');
    console.error('   - Network connection');
  }
};

// แสดงข้อมูลการตั้งค่า
console.log('🚀 [SYSTEM] Automatic Email Notification System');
console.log('📧 ระบบส่งอีเมลแจ้งเตือนอัตโนมัติ');
console.log('⚙️ ระบบเป็นผู้ส่ง ไม่ต้องรอแอดมิน\n');

// รันการทดสอบ
testAutomaticEmailSystem();
