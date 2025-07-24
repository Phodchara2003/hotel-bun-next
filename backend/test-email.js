// Test Email Functionality
require('dotenv').config();
const { generateOTP, sendOTPEmail, sendPasswordResetConfirmation } = require('./src/utils/emailService');

async function testEmail() {
  console.log('🧪 ทดสอบการส่งอีเมล OTP...');
  
  // ตรวจสอบ Environment Variables
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ กรุณาตั้งค่า GMAIL_USER และ GMAIL_APP_PASSWORD ใน .env file');
    console.log('📖 ดูคู่มือใน GMAIL_SETUP_GUIDE.md');
    return;
  }

  console.log('✅ Environment Variables พร้อมใช้งาน');
  console.log(`📧 ส่งจาก: ${process.env.GMAIL_USER}`);

  try {
    // สร้าง OTP ทดสอบ
    const testOTP = generateOTP();
    console.log(`🔢 OTP ทดสอบ: ${testOTP}`);

    // ส่งอีเมล OTP ทดสอบ
    const testEmail = 'test@example.com'; // เปลี่ยนเป็นอีเมลจริงของคุณ
    const userName = 'ผู้ใช้ทดสอบ';

    console.log(`📤 กำลังส่งอีเมลไปยัง: ${testEmail}`);
    
    const result = await sendOTPEmail(testEmail, testOTP, userName);
    
    if (result.success) {
      console.log('✅ ส่งอีเมล OTP สำเร็จ!');
      console.log(`📬 Message ID: ${result.messageId}`);
      
      // ทดสอบส่งอีเมลยืนยัน
      console.log('📧 กำลังส่งอีเมลยืนยันการเปลี่ยนรหัสผ่าน...');
      const confirmResult = await sendPasswordResetConfirmation(testEmail, userName);
      
      if (confirmResult.success) {
        console.log('✅ ส่งอีเมลยืนยันสำเร็จ!');
      } else {
        console.log('❌ ส่งอีเมลยืนยันไม่สำเร็จ:', confirmResult.error);
      }
      
    } else {
      console.log('❌ ส่งอีเมลไม่สำเร็จ:', result.error);
    }

  } catch (error) {
    console.error('💀 เกิดข้อผิดพลาด:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('🔐 ปัญหาการยืนยันตัวตน:');
      console.log('   - ตรวจสอบ GMAIL_USER และ GMAIL_APP_PASSWORD');
      console.log('   - ตรวจสอบว่าเปิด 2-Step Verification แล้ว');
      console.log('   - ตรวจสอบว่าสร้าง App Password แล้ว');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🌐 ปัญหาการเชื่อมต่ออินเทอร์เน็ต');
    }
  }
}

// เรียกใช้ฟังก์ชันทดสอบ
testEmail();
