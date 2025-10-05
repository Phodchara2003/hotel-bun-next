// ไฟล์ทดสอบระบบอีเมลอย่างง่าย - ตรวจสอบและแก้ไขปัญหาการตั้งค่า
require('dotenv').config({ path: './backend/.env' });

const { 
  sendBookingConfirmationEmail, 
  sendAdminNotificationEmail 
} = require('./backend/emailNotificationSystem.cjs');

async function testEmailSetup() {
  console.log('🔧 กำลังตรวจสอบการตั้งค่าระบบอีเมล...');
  console.log('='.repeat(60));

  // ตรวจสอบ environment variables
  console.log('📋 ตรวจสอบการตั้งค่า Environment Variables:');
  console.log(`GMAIL_USER: ${process.env.GMAIL_USER || '❌ ไม่ได้ตั้งค่า'}`);
  console.log(`GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '✅ ตั้งค่าแล้ว' : '❌ ไม่ได้ตั้งค่า'}`);
  console.log('');

  // ตรวจสอบว่าตั้งค่าครบหรือไม่
  if (!process.env.GMAIL_USER || process.env.GMAIL_USER === 'your-email@gmail.com') {
    console.log('❌ GMAIL_USER ยังไม่ได้ตั้งค่าหรือเป็นค่า default');
    showSetupInstructions();
    return;
  }

  if (!process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD === 'your-app-password') {
    console.log('❌ GMAIL_APP_PASSWORD ยังไม่ได้ตั้งค่าหรือเป็นค่า default');
    showSetupInstructions();
    return;
  }

  console.log('✅ การตั้งค่า environment variables ดูถูกต้อง');
  console.log('');

  // ทดสอบส่งอีเมล
  console.log('📧 ทดสอบการส่งอีเมล...');
  
  const testBookingData = {
    bookingReference: 'TEST-' + Date.now(),
    hotelName: 'โรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม',
    roomTypeName: 'ห้องเดี่ยวธรรมดา',
    checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // พรุ่งนี้
    checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 วันจากนี้
    guests: 2,
    totalPrice: 1500,
    customerName: 'ลูกค้า ทดสอบ',
    customerEmail: process.env.GMAIL_USER // ส่งให้ตัวเอง
  };

  try {
    console.log('🔄 กำลังทดสอบส่งอีเมลยืนยันการจอง...');
    const result = await sendBookingConfirmationEmail(
      process.env.GMAIL_USER,
      testBookingData,
      'ลูกค้า ทดสอบ'
    );

    if (result.success) {
      console.log('✅ ส่งอีเมลสำเร็จ!');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📬 อีเมลถูกส่งไปที่: ${process.env.GMAIL_USER}`);
      console.log('');
      console.log('🎉 ระบบอีเมลทำงานปกติ! ตอนนี้เมื่อมีการจองใหม่ อีเมลจะถูกส่งอัตโนมัติ');
    } else {
      console.log('❌ ส่งอีเมลไม่สำเร็จ');
      console.log(`🔍 ข้อผิดพลาด: ${result.error}`);
      console.log('');
      showTroubleshootingGuide(result.error);
    }
  } catch (error) {
    console.log('❌ เกิดข้อผิดพลาดในการทดสอบ');
    console.log(`🔍 ข้อผิดพลาด: ${error.message}`);
    console.log('');
    showTroubleshootingGuide(error.message);
  }
}

function showSetupInstructions() {
  console.log('');
  console.log('🛠️  วิธีตั้งค่าระบบอีเมล:');
  console.log('='.repeat(60));
  console.log('');
  console.log('1️⃣ สร้าง Gmail App Password:');
  console.log('   • ไปที่ https://myaccount.google.com');
  console.log('   • เมนู Security → 2-Step Verification (เปิดให้เรียบร้อยก่อน)');
  console.log('   • เมนู Security → App passwords');
  console.log('   • Select app: Mail, Select device: Other');
  console.log('   • ตั้งชื่อ: "Hotel Booking System"');
  console.log('   • คัดลอกรหัส 16 ตัว (รูปแบบ: xxxx xxxx xxxx xxxx)');
  console.log('');
  console.log('2️⃣ แก้ไขไฟล์ backend/.env:');
  console.log('   GMAIL_USER=your-real-email@gmail.com');
  console.log('   GMAIL_APP_PASSWORD=your-16-digit-app-password');
  console.log('');
  console.log('3️⃣ รีสตาร์ทเซิร์ฟเวอร์และทดสอบอีกครั้ง:');
  console.log('   node mysql-server.cjs');
  console.log('');
}

function showTroubleshootingGuide(errorMessage) {
  console.log('🔧 วิธีแก้ไขปัญหา:');
  console.log('='.repeat(60));
  
  if (errorMessage.includes('Invalid login') || errorMessage.includes('Username and Password')) {
    console.log('❌ ปัญหา: รหัสผ่านไม่ถูกต้อง');
    console.log('✅ วิธีแก้:');
    console.log('   1. ตรวจสอบว่าเปิด 2-Step Verification แล้ว');
    console.log('   2. สร้าง App Password ใหม่');
    console.log('   3. ใส่รหัส 16 ตัวใน GMAIL_APP_PASSWORD (ไม่ใส่เว้นวรรค)');
  } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connect')) {
    console.log('❌ ปัญหา: ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์อีเมลได้');
    console.log('✅ วิธีแก้:');
    console.log('   1. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
    console.log('   2. ตรวจสอบ Firewall settings');
    console.log('   3. ลองใช้ VPN หากจำเป็น');
  } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
    console.log('❌ ปัญหา: เกินขีดจำกัดการส่งอีเมล');
    console.log('✅ วิธีแก้:');
    console.log('   1. รอสักครู่แล้วลองใหม่');
    console.log('   2. ตรวจสอบ Gmail quota limits');
  } else {
    console.log('❌ ปัญหาอื่นๆ:');
    console.log('✅ ขั้นตอนการแก้ไข:');
    console.log('   1. ตรวจสอบการตั้งค่า .env อีกครั้ง');
    console.log('   2. ตรวจสอบ Gmail account settings');
    console.log('   3. ลองใช้อีเมล Gmail อื่น');
  }
  
  console.log('');
  console.log('📞 หากยังมีปัญหา:');
  console.log('   • ตรวจสอบ backend/.env');
  console.log('   • ดู error logs ใน terminal');
  console.log('   • ลองใช้ test-email-system.cjs');
}

// รันการทดสอบ
if (require.main === module) {
  console.log('🚀 เริ่มทดสอบระบบอีเมล...');
  console.log(`⏰ เวลา: ${new Date().toLocaleString('th-TH')}`);
  console.log('');
  
  testEmailSetup()
    .then(() => {
      console.log('');
      console.log('✅ การทดสอบเสร็จสิ้น');
    })
    .catch((error) => {
      console.error('💥 เกิดข้อผิดพลาดในการทดสอบ:', error);
    });
}

module.exports = { testEmailSetup };