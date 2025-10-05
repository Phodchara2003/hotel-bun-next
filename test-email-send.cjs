// ไฟล์ทดสอบการส่งอีเมลแบบง่าย
require('dotenv').config({ path: './backend/.env' });

const { 
  sendBookingConfirmationEmail, 
  sendAdminNotificationEmail,
  testEmailConnection 
} = require('./backend/emailNotificationSystem.cjs');

async function testEmailSending() {
  console.log('🚀 เริ่มทดสอบการส่งอีเมล...');
  console.log('⏰ เวลา:', new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }));
  console.log('');

  // ข้อมูลการจองจำลอง
  const mockBooking = {
    id: 'TEST-001',
    bookingReference: 'BK-2025-001', // เพิ่มฟิลด์นี้
    guest_name: 'ทดสอบ ระบบอีเมล',
    guest_email: 'hotelsystem.rmu.ac.th@gmail.com', // ใช้อีเมลเดียวกันเพื่อทดสอบ
    guest_phone: '099-999-9999',
    check_in_date: '2025-10-06',
    check_out_date: '2025-10-07',
    total_price: 1500,
    room_number: '101',
    room_type: 'Standard Room',
    special_requests: 'ทดสอบระบบอีเมล'
  };

  try {
    console.log('🔧 ทดสอบการเชื่อมต่อ Gmail...');
    
    // ทดสอบการเชื่อมต่อก่อน
    if (testEmailConnection) {
      const connectionTest = await testEmailConnection();
      console.log('📡 การเชื่อมต่อ:', connectionTest ? '✅ สำเร็จ' : '❌ ล้มเหลว');
    }

    console.log('');
    console.log('📧 ทดสอบส่งอีเมลยืนยันการจอง...');
    
    // ทดสอบส่งอีเมลยืนยันการจอง
    const bookingResult = await sendBookingConfirmationEmail(
      mockBooking.guest_email, 
      mockBooking, 
      mockBooking.guest_name
    );
    console.log('✅ อีเมลยืนยันการจอง:', bookingResult ? 'ส่งสำเร็จ' : 'ส่งไม่สำเร็จ');
    
    if (bookingResult && bookingResult.messageId) {
      console.log('📬 Message ID:', bookingResult.messageId);
    }

    console.log('');
    console.log('🔔 ทดสอบส่งอีเมลแจ้งเตือนแอดมิน...');
    
    // ทดสอบส่งอีเมลแจ้งเตือนแอดมิน
    const adminResult = await sendAdminNotificationEmail(mockBooking);
    console.log('✅ อีเมลแจ้งเตือนแอดมิน:', adminResult ? 'ส่งสำเร็จ' : 'ส่งไม่สำเร็จ');
    
    if (adminResult && adminResult.messageId) {
      console.log('📬 Message ID:', adminResult.messageId);
    }

    console.log('');
    console.log('🎉 การทดสอบเสร็จสิ้น!');
    console.log('📝 หากอีเมลส่งสำเร็จ ให้ตรวจสอบ inbox ที่: hotelsystem.rmu.ac.th@gmail.com');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการทดสอบ:');
    console.error('🔍 รายละเอียด:', error.message);
    console.error('📋 Stack trace:', error.stack);
    
    // แสดงข้อแนะนำการแก้ไข
    console.log('');
    console.log('🛠️  ข้อแนะนำการแก้ไข:');
    
    if (error.message.includes('Invalid login')) {
      console.log('❌ Gmail credentials ไม่ถูกต้อง');
      console.log('   • ตรวจสอบ GMAIL_USER และ GMAIL_APP_PASSWORD ใน .env');
      console.log('   • ตรวจสอบว่า App Password สร้างถูกต้อง');
    } else if (error.message.includes('authentication')) {
      console.log('❌ ปัญหาการยืนยันตัวตน');
      console.log('   • ตรวจสอบว่าเปิด 2-Step Verification แล้ว');
      console.log('   • สร้าง App Password ใหม่');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
      console.log('❌ ปัญหาการเชื่อมต่ออินเทอร์เน็ต');
      console.log('   • ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
      console.log('   • ตรวจสอบ Firewall หรือ Antivirus');
    } else {
      console.log('❌ ปัญหาอื่นๆ');
      console.log('   • ตรวจสอบไฟล์ .env');
      console.log('   • ลองรีสตาร์ทโปรแกรม');
    }
  }
}

// เรียกใช้ฟังก์ชันทดสอบ
testEmailSending();