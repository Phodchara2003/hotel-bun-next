// ไฟล์สำหรับทดสอบระบบการแจ้งเตือนอีเมล
// Test Email Notification System

const { 
  sendBookingConfirmationEmail, 
  sendAdminNotificationEmail, 
  sendCheckInReminderEmail 
} = require('./backend/emailNotificationSystem.cjs');

async function testEmailSystem() {
  console.log('🧪 Testing Email Notification System...');
  console.log('='.repeat(60));

  // ข้อมูลทดสอบการจอง
  const testBookingData = {
    bookingReference: 'TEST-' + Date.now(),
    hotelName: 'โรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม',
    roomTypeName: 'ห้องเดี่ยวธรรมดา',
    checkInDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // พรุ่งนี้
    checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 วันจากนี้
    guests: 2,
    totalPrice: 1500,
    customerName: 'นาย ทดสอบ ระบบ',
    customerEmail: process.env.TEST_EMAIL || 'test@example.com'
  };

  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  const testUserName = 'นาย ทดสอบ ระบบ';

  console.log(`📧 Test email will be sent to: ${testEmail}`);
  console.log('');

  try {
    // ทดสอบ 1: อีเมลยืนยันการจอง
    console.log('1️⃣ Testing booking confirmation email...');
    const confirmationResult = await sendBookingConfirmationEmail(
      testEmail,
      testBookingData,
      testUserName
    );
    
    if (confirmationResult.success) {
      console.log('✅ Booking confirmation email sent successfully');
      console.log(`   Message ID: ${confirmationResult.messageId}`);
    } else {
      console.log('❌ Failed to send booking confirmation email');
      console.log(`   Error: ${confirmationResult.error}`);
    }
    console.log('');

    // ทดสอบ 2: อีเมลแจ้งเตือนแอดมิน
    console.log('2️⃣ Testing admin notification email...');
    const adminResult = await sendAdminNotificationEmail(testBookingData);
    
    if (adminResult.success) {
      console.log('✅ Admin notification emails sent successfully');
      adminResult.results.forEach((result, index) => {
        if (result.success) {
          console.log(`   ✅ Admin ${index + 1} (${result.email}): ${result.messageId}`);
        } else {
          console.log(`   ❌ Admin ${index + 1} (${result.email}): ${result.error}`);
        }
      });
    } else {
      console.log('❌ Failed to send admin notification emails');
      console.log(`   Error: ${adminResult.error}`);
    }
    console.log('');

    // ทดสอบ 3: อีเมลแจ้งเตือนก่อนเข้าพัก
    console.log('3️⃣ Testing check-in reminder email...');
    const reminderResult = await sendCheckInReminderEmail(
      testEmail,
      testBookingData,
      testUserName
    );
    
    if (reminderResult.success) {
      console.log('✅ Check-in reminder email sent successfully');
      console.log(`   Message ID: ${reminderResult.messageId}`);
    } else {
      console.log('❌ Failed to send check-in reminder email');
      console.log(`   Error: ${reminderResult.error}`);
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 Email notification system test completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Check your email inbox for test messages');
    console.log('2. Verify all templates display correctly');
    console.log('3. Configure production email settings in .env file');
    console.log('4. Test with real booking data');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// เรียกใช้การทดสอบ
if (require.main === module) {
  console.log('🔧 Environment check:');
  console.log(`GMAIL_USER: ${process.env.GMAIL_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Not set'}`);
  console.log(`ADMIN_EMAIL_1: ${process.env.ADMIN_EMAIL_1 || 'Not set'}`);
  console.log(`ADMIN_EMAIL_2: ${process.env.ADMIN_EMAIL_2 || 'Not set'}`);
  console.log(`TEST_EMAIL: ${process.env.TEST_EMAIL || 'Not set'}`);
  console.log('');

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log('⚠️  Warning: Email credentials not configured!');
    console.log('Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file');
    console.log('');
    console.log('Example .env configuration:');
    console.log('GMAIL_USER=your-email@gmail.com');
    console.log('GMAIL_APP_PASSWORD=your-app-specific-password');
    console.log('ADMIN_EMAIL_1=admin@hotel.com');
    console.log('ADMIN_EMAIL_2=manager@hotel.com');
    console.log('TEST_EMAIL=test@example.com');
    console.log('');
    console.log('To create Gmail App Password:');
    console.log('1. Go to Google Account Settings');
    console.log('2. Security > 2-Step Verification');
    console.log('3. App passwords > Generate password');
    console.log('4. Use the generated password in GMAIL_APP_PASSWORD');
    console.log('');
  } else {
    testEmailSystem();
  }
}

module.exports = { testEmailSystem };