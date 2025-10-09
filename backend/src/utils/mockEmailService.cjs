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
        ${bookingData.roomNumber ? `<p><strong>หมายเลขห้อง:</strong> ห้อง ${bookingData.roomNumber}${bookingData.floor ? ` ชั้น ${bookingData.floor}` : ''}</p>` : ''}
        <p><strong>โรงแรม:</strong> ${bookingData.hotelName || 'โรงแรมวรุณภัฏ'}</p>
        <p><strong>ประเภทห้อง:</strong> ${bookingData.roomTypeName || 'N/A'}</p>
        ${bookingData.bedType ? `<p><strong>ประเภทเตียง:</strong> ${bookingData.bedType}</p>` : ''}
        <p><strong>วันที่เข้าพัก:</strong> ${bookingData.checkInDate || 'N/A'}</p>
        <p><strong>วันที่ออก:</strong> ${bookingData.checkOutDate || 'N/A'}</p>
        ${bookingData.nights ? `<p><strong>จำนวนคืน:</strong> ${bookingData.nights} คืน</p>` : ''}
        <p><strong>จำนวนผู้เข้าพัก:</strong> ${bookingData.guests || 'N/A'} ท่าน${bookingData.maxGuests ? ` (สูงสุด ${bookingData.maxGuests} ท่าน)` : ''}</p>
        ${bookingData.pricePerNight ? `<p><strong>ราคาต่อคืน:</strong> ฿${bookingData.pricePerNight?.toLocaleString()}</p>` : ''}
        <p><strong>ราคารวม:</strong> ฿${bookingData.totalPrice?.toLocaleString() || 'N/A'}</p>
        ${bookingData.specialRequests ? `<p><strong>ความต้องการพิเศษ:</strong> ${bookingData.specialRequests}</p>` : ''}
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
        <p><strong>โรงแรม:</strong> ${bookingData.hotelName || 'โรงแรมวรุณภัฏ'}</p>
        <p><strong>ประเภทห้อง:</strong> ${bookingData.roomTypeName || 'N/A'}</p>
        ${bookingData.bedType ? `<p><strong>ประเภทเตียง:</strong> ${bookingData.bedType}</p>` : ''}
        <p><strong>วันที่เข้าพักใหม่:</strong> ${bookingData.checkInDate || 'N/A'}</p>
        <p><strong>วันที่ออกใหม่:</strong> ${bookingData.checkOutDate || 'N/A'}</p>
        ${bookingData.nights ? `<p><strong>จำนวนคืน:</strong> ${bookingData.nights} คืน</p>` : ''}
        <p><strong>จำนวนผู้เข้าพัก:</strong> ${bookingData.guests || 'N/A'} ท่าน</p>
        ${bookingData.pricePerNight ? `<p><strong>ราคาต่อคืน:</strong> ฿${bookingData.pricePerNight?.toLocaleString()}</p>` : ''}
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
        <p><strong>ประเภทห้อง:</strong> ${bookingData.roomTypeName || 'N/A'}</p>
        ${bookingData.bedType ? `<p><strong>ประเภทเตียง:</strong> ${bookingData.bedType}</p>` : ''}
        <p><strong>วันที่เข้าพัก:</strong> ${bookingData.checkInDate || 'N/A'}</p>
        <p><strong>วันที่ออก:</strong> ${bookingData.checkOutDate || 'N/A'}</p>
        ${bookingData.nights ? `<p><strong>จำนวนคืน:</strong> ${bookingData.nights} คืน</p>` : ''}
        <p><strong>จำนวนผู้เข้าพัก:</strong> ${bookingData.guests || 'N/A'} ท่าน</p>
        ${bookingData.pricePerNight ? `<p><strong>ราคาต่อคืน:</strong> ฿${bookingData.pricePerNight?.toLocaleString()}</p>` : ''}
        <p><strong>ราคารวม:</strong> ฿${bookingData.totalPrice?.toLocaleString() || 'N/A'}</p>
        ${bookingData.specialRequests ? `<p><strong>ความต้องการพิเศษ:</strong> ${bookingData.specialRequests}</p>` : ''}
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
  try {
    // ใช้อีเมลจากไฟล์ backend/.env - รองรับทั้งแบบเดียวและหลายอีเมล
    const adminEmailsString = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL_1 || 'hotelsystem.rmu.ac.th@gmail.com';
    const adminEmails = adminEmailsString.split(',').map(email => email.trim()).filter(email => email && email.includes('@'));

    console.log('📧 Sending admin notification emails to:', adminEmails);

    const subject = '🆕 มีการจองใหม่ต้องการการอนุมัติ - โรงแรมวรุณภัฏ';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; font-size: 24px;">🆕 การจองใหม่เข้าสู่ระบบ</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">มีการจองใหม่ต้องการการอนุมัติจากแอดมิน</p>
          </div>
          
          <div style="background: #fff3e0; border: 1px solid #ff9800; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p style="color: #e65100; font-weight: bold; margin: 0; font-size: 16px;">
              ⚠️ การจองนี้รอการอนุมัติจากแอดมิน กรุณาดำเนินการโดยเร็วที่สุด
            </p>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="color: #1976d2; margin-top: 0;">📋 รายละเอียดการจอง</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">รหัสการจอง:</td>
                <td style="padding: 8px 0; color: #333;">${bookingData.bookingReference || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">ชื่อลูกค้า:</td>
                <td style="padding: 8px 0; color: #333;">${bookingData.customerName || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">อีเมลลูกค้า:</td>
                <td style="padding: 8px 0; color: #333;">${bookingData.customerEmail || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">โรงแรม:</td>
                <td style="padding: 8px 0; color: #333;">${bookingData.hotelName || 'โรงแรมวรุณภัฏ'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">ประเภทห้อง:</td>
                <td style="padding: 8px 0; color: #333;">${bookingData.roomTypeName || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">วันที่เข้าพัก:</td>
                <td style="padding: 8px 0; color: #333;">${new Date(bookingData.checkInDate).toLocaleDateString('th-TH') || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 8px 0; font-weight: bold; color: #555;">วันที่ออก:</td>
                <td style="padding: 8px 0; color: #333;">${new Date(bookingData.checkOutDate).toLocaleDateString('th-TH') || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">ราคารวม:</td>
                <td style="padding: 8px 0; color: #28a745; font-weight: bold; font-size: 18px;">฿${bookingData.totalPrice?.toLocaleString() || 'N/A'}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3002/admin/bookings" style="
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            ">🏨 ไปที่หน้าแอดมิน Admin Panel</a>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              📞 หากมีข้อสงสัย กรุณาติดต่อ: 043-721-040<br>
              <strong>ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม</strong><br>
              <small>วันที่: ${new Date().toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</small>
            </p>
          </div>
        </div>
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
        console.log(`✅ Admin notification email sent to ${adminEmail}`);
        results.push({ email: adminEmail, success: true, messageId: result.messageId });
      } catch (error) {
        console.error(`❌ Failed to send admin email to ${adminEmail}:`, error);
        results.push({ email: adminEmail, success: false, error: error.message });
      }
    }

    console.log('📧 Admin notification email sending completed:', results);
    return { success: true, results };
  } catch (error) {
    console.error('❌ Error in sendAdminNotificationEmail:', error);
    return { success: false, error: error.message };
  }
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