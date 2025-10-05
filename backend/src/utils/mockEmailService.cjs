// Mock Email Service สำหรับการพัฒนา
// จะ log แทนการส่งอีเมลจริง

// โหลด environment variables จากไฟล์ backend/.env
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

class MockEmailService {
  constructor() {
    this.sentEmails = [];
  }

  async sendEmail(options) {
    try {
      const emailData = {
        timestamp: new Date().toISOString(),
        to: options.to,
        subject: options.subject,
        html: options.html || options.text,
        from: options.from,
        id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // เก็บข้อมูลอีเมลที่ส่ง
      this.sentEmails.push(emailData);

      // แสดงใน console
      console.log('\n📧 =================== MOCK EMAIL SENT ===================');
      console.log(`📬 To: ${emailData.to}`);
      console.log(`📝 Subject: ${emailData.subject}`);
      console.log(`⏰ Time: ${emailData.timestamp}`);
      console.log(`🆔 ID: ${emailData.id}`);
      console.log('📄 Content Preview:');
      console.log(this.extractTextFromHTML(emailData.html).substring(0, 200) + '...');
      console.log('=================== END MOCK EMAIL ===================\n');

      return {
        success: true,
        messageId: emailData.id,
        response: 'Mock email sent successfully'
      };
    } catch (error) {
      console.error('❌ Mock Email Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  extractTextFromHTML(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }

  // ฟังก์ชันสำหรับดูอีเมลที่ส่งไปแล้ว
  getSentEmails(count = 10) {
    return this.sentEmails.slice(-count);
  }

  // ฟังก์ชันสำหรับล้างประวัติ
  clearHistory() {
    this.sentEmails = [];
  }
}

// สร้าง instance เดียว
const mockEmailService = new MockEmailService();

// Define functions ที่เหมือนกับ emailService จริง
const sendBookingConfirmationEmail = async (userEmail, userName, bookingData) => {
  const subject = '✅ ยืนยันการจองห้องพัก - โรงแรมวรุณภัฏ';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>🏨 ยืนยันการจองห้องพัก</h2>
      <p>เรียน คุณ${userName}</p>
      <p>ระบบได้รับการจองห้องพักของคุณแล้ว</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>📋 รายละเอียดการจอง</h3>
        <p><strong>รหัสการจอง:</strong> ${bookingData.bookingReference || 'N/A'}</p>
        <p><strong>โรงแรม:</strong> ${bookingData.hotelName || 'โรงแรมวรุณภัฏ'}</p>
        <p><strong>ประเภทห้อง:</strong> ${bookingData.roomTypeName || 'N/A'}</p>
        <p><strong>วันที่เข้าพัก:</strong> ${bookingData.checkInDate || 'N/A'}</p>
        <p><strong>วันที่ออก:</strong> ${bookingData.checkOutDate || 'N/A'}</p>
        <p><strong>จำนวนผู้เข้าพัก:</strong> ${bookingData.guests || 'N/A'} ท่าน</p>
        <p><strong>ราคารวม:</strong> ฿${bookingData.totalPrice?.toLocaleString() || 'N/A'}</p>
      </div>
      
      <p>📞 หากมีข้อสงสัย กรุณาติดต่อ: 043-721-040</p>
      <p>ขอบคุณที่ใช้บริการ</p>
    </div>
  `;

  return await mockEmailService.sendEmail({
    to: userEmail,
    subject: subject,
    html: html,
    from: 'hotelvarunkorn@gmail.com'
  });
};

const sendBookingUpdateEmail = async (userEmail, userName, bookingData) => {
  const subject = '🔄 แจ้งเตือนการแก้ไขการจอง - โรงแรมวรุณภัฏ';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>🔄 การจองของคุณได้รับการแก้ไข</h2>
      <p>เรียน คุณ${userName}</p>
      <p>การจองห้องพักของคุณได้รับการแก้ไขแล้ว</p>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>📋 รายละเอียดการจองใหม่</h3>
        <p><strong>รหัสการจอง:</strong> ${bookingData.bookingReference || 'N/A'}</p>
        <p><strong>วันที่เข้าพักใหม่:</strong> ${bookingData.checkInDate || 'N/A'}</p>
        <p><strong>วันที่ออกใหม่:</strong> ${bookingData.checkOutDate || 'N/A'}</p>
        <p><strong>ราคารวมใหม่:</strong> ฿${bookingData.totalPrice?.toLocaleString() || 'N/A'}</p>
      </div>
      
      <p>📞 หากมีข้อสงสัย กรุณาติดต่อ: 043-721-040</p>
      <p>ขอบคุณที่ใช้บริการ</p>
    </div>
  `;

  return await mockEmailService.sendEmail({
    to: userEmail,
    subject: subject,
    html: html,
    from: 'hotelvarunkorn@gmail.com'
  });
};

const sendBookingCancellationEmail = async (userEmail, userName, bookingData) => {
  const subject = '❌ แจ้งเตือนการยกเลิกการจอง - โรงแรมวรุณภัฏ';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>❌ การจองของคุณถูกยกเลิก</h2>
      <p>เรียน คุณ${userName}</p>
      <p>การจองห้องพักของคุณได้ถูกยกเลิกแล้ว</p>
      
      <div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>📋 รายละเอียดการจองที่ยกเลิก</h3>
        <p><strong>รหัสการจอง:</strong> ${bookingData.bookingReference || 'N/A'}</p>
        <p><strong>โรงแรม:</strong> ${bookingData.hotelName || 'โรงแรมวรุณภัฏ'}</p>
        <p><strong>วันที่เข้าพัก:</strong> ${bookingData.checkInDate || 'N/A'}</p>
        <p><strong>วันที่ออก:</strong> ${bookingData.checkOutDate || 'N/A'}</p>
      </div>
      
      <p>📞 หากมีข้อสงสัย กรุณาติดต่อ: 043-721-040</p>
      <p>ขอบคุณที่ใช้บริการ</p>
    </div>
  `;

  return await mockEmailService.sendEmail({
    to: userEmail,
    subject: subject,
    html: html,
    from: 'hotelvarunkorn@gmail.com'
  });
};

const sendAdminNotificationEmail = async (bookingData) => {
  // ใช้อีเมลจากไฟล์ backend/.env - รองรับทั้งแบบเดียวและหลายอีเมล
  const adminEmailsString = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL_1 || 'hotelsystem.rmu.ac.th@gmail.com';
  const adminEmails = adminEmailsString.split(',').map(email => email.trim()).filter(email => email && email.includes('@'));

  console.log('📧 Sending admin notification emails to:', adminEmails);

  const subject = '🆕 มีการจองใหม่ต้องการการอนุมัติ - โรงแรมวรุณภัฏ';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d32f2f;">🆕 มีการจองใหม่ต้องการการอนุมัติ</h2>
      
      <div style="background: #ffebee; border: 1px solid #ef5350; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="color: #c62828; font-weight: bold; margin: 0;">
          ⚠️ การจองนี้รอการอนุมัติจากแอดมิน กรุณาดำเนินการโดยเร็วที่สุด
        </p>
      </div>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>📋 รายละเอียดการจอง</h3>
        <p><strong>รหัสการจอง:</strong> ${bookingData.bookingReference || 'N/A'}</p>
        <p><strong>ชื่อลูกค้า:</strong> ${bookingData.customerName || 'N/A'}</p>
        <p><strong>อีเมลลูกค้า:</strong> ${bookingData.customerEmail || 'N/A'}</p>
        <p><strong>โรงแรม:</strong> ${bookingData.hotelName || 'โรงแรมวรุณภัฏ'}</p>
        <p><strong>ประเภทห้อง:</strong> ${bookingData.roomTypeName || 'N/A'}</p>
        <p><strong>วันที่เข้าพัก:</strong> ${bookingData.checkInDate || 'N/A'}</p>
        <p><strong>วันที่ออก:</strong> ${bookingData.checkOutDate || 'N/A'}</p>
        <p><strong>ราคารวม:</strong> ฿${bookingData.totalPrice?.toLocaleString() || 'N/A'}</p>
      </div>
      
      <div style="background: #fff3e0; border: 1px solid #ff9800; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="color: #e65100; font-weight: bold; margin: 0;">
          👨‍💼 กรุณาเข้าสู่ระบบ Admin Panel เพื่อตรวจสอบและอนุมัติการจองนี้
        </p>
      </div>
      
      <p>📞 หากมีข้อสงสัย กรุณาติดต่อ: 043-721-040</p>
      <p><strong>ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม</strong></p>
    </div>
  `;

  // ส่งอีเมลไปยังแอดมินทุกคน
  const results = [];
  for (const adminEmail of adminEmails) {
    try {
      const result = await mockEmailService.sendEmail({
        to: adminEmail,
        subject: subject,
        html: html,
        from: 'hotelvarunkorn@gmail.com'
      });
      results.push({ email: adminEmail, success: true, messageId: result.messageId });
    } catch (error) {
      console.error(`❌ Failed to send admin email to ${adminEmail}:`, error);
      results.push({ email: adminEmail, success: false, error: error.message });
    }
  }

  return { success: true, results };
};

// Export utility functions
const getSentEmails = (count) => mockEmailService.getSentEmails(count);
const clearEmailHistory = () => mockEmailService.clearHistory();

module.exports = {
  sendBookingUpdateEmail,
  sendBookingCancellationEmail,
  sendAdminNotificationEmail,
  getSentEmails,
  clearEmailHistory,
  default: mockEmailService
};