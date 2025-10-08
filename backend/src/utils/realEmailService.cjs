// Real Email Service สำหรับการส่งอีเมลจริงผ่าน Gmail
const nodemailer = require('nodemailer');

// โหลด environment variables จากไฟล์ backend/.env
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

class RealEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // สร้าง Gmail transporter
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      
      console.log('✅ Gmail transporter initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gmail transporter:', error.message);
    }
  }

  // ส่งอีเมลแจ้งเตือนแอดมินเมื่อมีการจองใหม่
  async sendAdminNotificationEmail(bookingData) {
    console.log('� REAL EMAIL SERVICE: Starting to send real admin notification email...');
    console.log('📧 REAL EMAIL SERVICE: Booking data received:', bookingData);
    
    try {
      // ตรวจสอบ transporter
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      // สร้างเนื้อหาอีเมล HTML
      const htmlContent = this.createAdminNotificationHTML(bookingData);
      
      // รายการอีเมลแอดมิน
      const adminEmails = this.getAdminEmails();
      console.log('📮 Sending to admin emails:', adminEmails);
      
      // ส่งอีเมลไปยังแอดมินทั้งหมด
      const results = [];
      
      for (const adminEmail of adminEmails) {
        try {
          const mailOptions = {
            from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
            to: adminEmail,
            subject: `🏨 การจองใหม่เข้ามา - ${bookingData.bookingReference}`,
            html: htmlContent
          };

          console.log(`📤 Sending email to ${adminEmail}...`);
          const info = await this.transporter.sendMail(mailOptions);
          
          console.log(`✅ Email sent successfully to ${adminEmail}`);
          console.log(`📩 Message ID: ${info.messageId}`);
          
          results.push({
            email: adminEmail,
            success: true,
            messageId: info.messageId,
            response: info.response
          });
          
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${adminEmail}:`, emailError.message);
          results.push({
            email: adminEmail,
            success: false,
            error: emailError.message
          });
        }
      }
      
      console.log('📧 Real admin notification email sending completed:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Error sending admin notification email:', error.message);
      throw error;
    }
  }

  // สร้าง HTML สำหรับอีเมลแจ้งเตือนแอดมิน
  createAdminNotificationHTML(bookingData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>การจองใหม่เข้ามา</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
            .content { padding: 30px; }
            .booking-card { background-color: #f8f9ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: 600; color: #555; }
            .info-value { color: #333; }
            .price { font-size: 24px; font-weight: bold; color: #27ae60; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏨 การจองใหม่เข้ามา</h1>
                <p>มีลูกค้าจองห้องพักใหม่เข้ามาแล้ว</p>
            </div>
            
            <div class="content">
                <div class="booking-card">
                    <h2 style="margin-top: 0; color: #667eea;">📋 รายละเอียดการจอง</h2>
                    
                    <div class="info-row">
                        <span class="info-label">🎫 หมายเลขการจอง:</span>
                        <span class="info-value"><strong>${bookingData.bookingReference}</strong></span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">👤 ชื่อลูกค้า:</span>
                        <span class="info-value">${bookingData.customerName}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">📧 อีเมล:</span>
                        <span class="info-value">${bookingData.customerEmail}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">🏨 โรงแรม:</span>
                        <span class="info-value">${bookingData.hotelName}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">🛏️ ประเภทห้อง:</span>
                        <span class="info-value">${bookingData.roomTypeName}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">📅 วันที่เช็คอิน:</span>
                        <span class="info-value">${new Date(bookingData.checkInDate).toLocaleDateString('th-TH')}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">📅 วันที่เช็คเอาท์:</span>
                        <span class="info-value">${new Date(bookingData.checkOutDate).toLocaleDateString('th-TH')}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">💰 ราคารวม:</span>
                        <span class="info-value price">฿${bookingData.totalPrice?.toLocaleString()}</span>
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <a href="http://localhost:3002/admin/bookings" class="button">
                        📊 ดูรายละเอียดในระบบ
                    </a>
                </div>
                
                <p style="margin-top: 30px; padding: 15px; background-color: #e3f2fd; border-radius: 5px; color: #1565c0;">
                    💡 <strong>หมายเหตุ:</strong> กรุณาติดตามและจัดการการจองนี้ในระบบแอดมินของโรงแรม
                </p>
            </div>
            
            <div class="footer">
                <p>📧 อีเมลนี้ส่งโดยอัตโนมัติจากระบบจองห้องพักโรงแรม</p>
                <p style="font-size: 12px; color: #999;">⏰ ส่งเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // ดึงรายการอีเมลแอดมิน
  getAdminEmails() {
    const adminEmails = [];
    
    // เพิ่มอีเมลจาก ADMIN_EMAILS (หลายอีเมล)
    if (process.env.ADMIN_EMAILS) {
      const emails = process.env.ADMIN_EMAILS.split(',').map(email => email.trim()).filter(email => email);
      adminEmails.push(...emails);
    }
    
    // เพิ่มอีเมลจาก ADMIN_EMAIL_1 (อีเมลหลัก)
    if (process.env.ADMIN_EMAIL_1 && !adminEmails.includes(process.env.ADMIN_EMAIL_1)) {
      adminEmails.push(process.env.ADMIN_EMAIL_1);
    }
    
    // ถ้าไม่มีอีเมลแอดมิน ใช้อีเมลเริ่มต้น
    if (adminEmails.length === 0) {
      adminEmails.push('admin@hotel.com', 'manager@hotel.com');
    }
    
    return [...new Set(adminEmails)]; // ลบอีเมลซ้ำ
  }

  // ทดสอบการเชื่อมต่อ
  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Transporter not initialized');
      }
      
      console.log('🔍 Testing Gmail connection...');
      await this.transporter.verify();
      console.log('✅ Gmail connection successful');
      return true;
    } catch (error) {
      console.error('❌ Gmail connection failed:', error.message);
      return false;
    }
  }
}

// สร้าง instance
const realEmailService = new RealEmailService();

module.exports = realEmailService;