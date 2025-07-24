import { sendBookingConfirmationEmail, sendBookingCancellationEmail, sendBookingUpdateEmail } from './src/utils/emailService.js';

const testBookingEmails = async () => {
  console.log('🧪 Testing Booking Email Notifications...\n');

  // ข้อมูลทดสอบ
  const testEmail = 'test@example.com'; // เปลี่ยนเป็นอีเมลของคุณ
  const testUser = 'ทดสอบ ระบบ';
  
  const bookingData = {
    bookingReference: 'HTL-TEST-001',
    hotelName: 'Grand Hotel Bangkok',  
    roomTypeName: 'Superior Double Room',
    checkInDate: '2025-02-01',
    checkOutDate: '2025-02-03',
    guests: 2,
    totalPrice: 3000,
    status: 'confirmed',
    specialRequests: 'ต้องการเตียงเสริม 1 เตียง'
  };

  try {
    // ทดสอบอีเมลยืนยันการจอง
    console.log('1️⃣ Testing Booking Confirmation Email...');
    const confirmResult = await sendBookingConfirmationEmail(testEmail, bookingData, testUser);
    console.log('✅ Booking confirmation email result:', confirmResult);
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // รอ 2 วินาที
    
    // ทดสอบอีเมลการยกเลิก
    console.log('\n2️⃣ Testing Booking Cancellation Email...');
    const cancelResult = await sendBookingCancellationEmail(testEmail, bookingData, testUser);
    console.log('✅ Booking cancellation email result:', cancelResult);
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // รอ 2 วินาที
    
    // ทดสอบอีเมลการอัปเดต
    console.log('\n3️⃣ Testing Booking Update Email...');
    const updateDetails = 'วันที่เข้าพักเปลี่ยนแปลงจาก 1 กุมภาพันธ์ เป็น 3 กุมภาพันธ์ 2568 เนื่องจากข้อจำกัดของโรงแรม';
    const updateResult = await sendBookingUpdateEmail(testEmail, bookingData, updateDetails, testUser);
    console.log('✅ Booking update email result:', updateResult);
    
    console.log('\n🎉 All email tests completed successfully!');
    console.log('📧 Please check your email inbox for the test emails.');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('📝 Make sure you have set up your email configuration:');
    console.error('   - GMAIL_USER environment variable');
    console.error('   - GMAIL_APP_PASSWORD environment variable');
  }
};

// รันการทดสอบ
testBookingEmails();
