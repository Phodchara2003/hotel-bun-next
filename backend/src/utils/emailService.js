import nodemailer from 'nodemailer';

// กำหนดค่า SMTP สำหรับ Gmail (ระบบเป็นคนส่ง)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // อีเมลของระบบ
      pass: process.env.GMAIL_APP_PASSWORD // รหัสของระบบ
    }
  });
};

// สร้างรหัส OTP 6 หลัก
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ส่ง OTP ผ่าน Email
const sendOTPEmail = async (email, otp, userName = 'ผู้ใช้') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Hotel Booking System',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: '🔐 รหัส OTP สำหรับรีเซ็ตรหัสผ่าน - Hotel Booking',
      html: `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>รหัส OTP</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #3b82f6;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #3b82f6;
              margin-bottom: 10px;
            }
            .otp-container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: white;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
              margin: 10px 0;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .otp-label {
              color: white;
              font-size: 16px;
              margin-bottom: 10px;
              opacity: 0.9;
            }
            .warning {
              background: #fef3cd;
              border: 1px solid #faebcd;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .warning-title {
              color: #856404;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .warning-text {
              color: #856404;
              font-size: 14px;
            }
            .info-box {
              background: #e1f5fe;
              border-left: 4px solid #0288d1;
              padding: 20px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              margin: 10px;
            }
            .steps {
              background: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .step {
              display: flex;
              align-items: center;
              margin: 10px 0;
              padding: 8px;
            }
            .step-number {
              background: #3b82f6;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: bold;
              margin-right: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏨 Hotel Booking System</div>
              <p style="color: #666; margin: 0;">ระบบจัดการการจองโรงแรม</p>
            </div>

            <h2 style="color: #333; margin-bottom: 20px;">
              สวัสดี คุณ${userName} 👋
            </h2>

            <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
              คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ นี่คือรหัส OTP ของคุณ:
            </p>

            <div class="otp-container">
              <div class="otp-label">🔐 รหัส OTP ของคุณ</div>
              <div class="otp-code">${otp}</div>
              <p style="color: white; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                ⏰ รหัสนี้ใช้ได้เพียง 10 นาที
              </p>
            </div>

            <div class="steps">
              <h3 style="color: #333; margin-bottom: 15px;">📝 วิธีใช้งาน:</h3>
              <div class="step">
                <div class="step-number">1</div>
                <span>กลับไปยังหน้าเว็บที่คุณขอรีเซ็ตรหัสผ่าน</span>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <span>ใส่รหัส OTP: <strong>${otp}</strong></span>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <span>ตั้งรหัสผ่านใหม่ที่คุณต้องการ</span>
              </div>
            </div>

            <div class="warning">
              <div class="warning-title">⚠️ ข้อสำคัญ:</div>
              <div class="warning-text">
                • รหัส OTP นี้ใช้ได้เพียง <strong>10 นาที</strong> เท่านั้น<br>
                • หากไม่ใช่คุณที่ขอรีเซ็ต กรุณาเพิกเฉยต่ออีเมลนี้<br>
                • อย่าแชร์รหัสนี้กับใครเด็ดขาด เพื่อความปลอดภัย
              </div>
            </div>

            <div class="info-box">
              <p style="margin: 0; color: #0277bd;">
                <strong>💡 เคล็ดลับ:</strong> หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน 
                อาจมีคนพยายามเข้าถึงบัญชีของคุณ กรุณาเปลี่ยนรหัสผ่านทันที
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666; margin-bottom: 15px;">
                หากมีปัญหาในการใช้งาน สามารถติดต่อเราได้ที่:
              </p>
              <div style="color: #3b82f6;">
                📧 support@hotel.com | 📞 02-xxx-xxxx
              </div>
            </div>

            <div class="footer">
              <p>
                <strong>Hotel Booking System</strong><br>
                อีเมลนี้ส่งจากระบบอัตโนมัติ กรุณาอย่าตอบกลับ
              </p>
              <p style="margin-top: 15px; font-size: 12px;">
                © 2025 Hotel Booking System. สงวนลิขสิทธิ์.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('OTP Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// ส่งอีเมลยืนยันเมื่อเปลี่ยนรหัสผ่านสำเร็จ
const sendPasswordResetConfirmation = async (email, userName = 'ผู้ใช้') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Hotel Booking System',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: '✅ เปลี่ยนรหัสผ่านสำเร็จ - Hotel Booking',
      html: `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>เปลี่ยนรหัสผ่านสำเร็จ</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10b981; padding-bottom: 20px;">
              <div style="font-size: 28px; font-weight: bold; color: #10b981; margin-bottom: 10px;">
                🏨 Hotel Booking System
              </div>
            </div>

            <h2 style="color: #10b981; text-align: center; margin-bottom: 30px;">
              ✅ เปลี่ยนรหัสผ่านสำเร็จ!
            </h2>

            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="color: #047857; font-size: 16px; margin: 0;">
                คุณ${userName} ได้เปลี่ยนรหัสผ่านเรียบร้อยแล้ว 🎉
              </p>
            </div>

            <div style="background: #fef3cd; border: 1px solid #faebcd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="color: #856404; font-weight: bold; margin-bottom: 10px;">
                🔒 เพื่อความปลอดภัย:
              </div>
              <div style="color: #856404; font-size: 14px;">
                • หากไม่ใช่คุณที่เปลี่ยนรหัสผ่าน กรุณาติดต่อเราทันที<br>
                • เก็บรหัสผ่านใหม่ให้ปลอดภัย<br>
                • อย่าแชร์รหัสผ่านกับใครเด็ดขาด
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666;">
                ตอนนี้คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
              </p>
              <a href="${process.env.FRONTEND_URL}/login" 
                 style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px;">
                🔑 เข้าสู่ระบบ
              </a>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p><strong>Hotel Booking System</strong></p>
              <p>📧 support@hotel.com | 📞 02-xxx-xxxx</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// ส่งอีเมลแจ้งเตือนการจองสำเร็จ
const sendBookingConfirmationEmail = async (userEmail, bookingData, userName = 'ผู้ใช้') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Hotel Booking System',
        address: process.env.GMAIL_USER
      },
      to: userEmail,
      subject: `🎉 ยืนยันการจองสำเร็จ - ${bookingData.hotelName}`,
      html: `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ยืนยันการจอง</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .booking-card {
              background: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #10b981;
            }
            .booking-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
            }
            .detail-item {
              padding: 10px;
              background: #f1f5f9;
              border-radius: 6px;
            }
            .detail-label {
              font-weight: bold;
              color: #475569;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .detail-value {
              color: #1e293b;
              font-size: 14px;
            }
            .status-badge {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 การจองของคุณสำเร็จแล้ว!</h1>
              <p>ขอบคุณที่เลือกใช้บริการ Hotel Booking System</p>
            </div>
            
            <div class="content">
              <p>สวัสดี <strong>${userName}</strong>,</p>
              <p>เราได้รับการจองของคุณเรียบร้อยแล้ว ต่อไปนี้คือรายละเอียดการจอง:</p>
              
              <div class="booking-card">
                <h3 style="margin: 0 0 10px 0; color: #1e293b;">
                  📋 รหัสการจอง: <span style="color: #3b82f6;">${bookingData.bookingReference}</span>
                </h3>
                <span class="status-badge">${bookingData.status === 'confirmed' ? 'ยืนยันแล้ว' : 'รอการยืนยัน'}</span>
              </div>
              
              <div class="booking-details">
                <div class="detail-item">
                  <div class="detail-label">🏨 โรงแรม</div>
                  <div class="detail-value">${bookingData.hotelName}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">🛏️ ประเภทห้อง</div>
                  <div class="detail-value">${bookingData.roomTypeName}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">📅 วันที่เข้าพัก</div>
                  <div class="detail-value">${new Date(bookingData.checkInDate).toLocaleDateString('th-TH')}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">📅 วันที่ออก</div>
                  <div class="detail-value">${new Date(bookingData.checkOutDate).toLocaleDateString('th-TH')}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">👥 จำนวนผู้เข้าพัก</div>
                  <div class="detail-value">${bookingData.guests} คน</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">💰 ราคารวม</div>
                  <div class="detail-value">${bookingData.totalPrice?.toLocaleString('th-TH')} บาท</div>
                </div>
              </div>
              
              ${bookingData.specialRequests ? `
                <div class="detail-item" style="grid-column: 1 / -1;">
                  <div class="detail-label">📝 ความต้องการพิเศษ</div>
                  <div class="detail-value">${bookingData.specialRequests}</div>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings" class="button">
                  ดูรายละเอียดการจอง
                </a>
              </div>
              
              <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #92400e;">📞 ติดต่อเรา</h4>
                <p style="margin: 0; color: #92400e;">
                  หากมีคำถามเกี่ยวกับการจอง กรุณาติดต่อเราที่ support@hotelbooking.com
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Hotel Booking System</strong></p>
              <p style="color: #666; font-size: 12px;">
                © 2025 Hotel Booking System. สงวนลิขสิทธิ์.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    throw error;
  }
};

// ส่งอีเมลแจ้งเตือนการยกเลิกการจอง
const sendBookingCancellationEmail = async (userEmail, bookingData, userName = 'ผู้ใช้') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Hotel Booking System',
        address: process.env.GMAIL_USER
      },
      to: userEmail,
      subject: `❌ การจองถูกยกเลิก - ${bookingData.hotelName}`,
      html: `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>การจองถูกยกเลิก</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .booking-card {
              background: #fef2f2;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #ef4444;
            }
            .status-badge {
              display: inline-block;
              background: #ef4444;
              color: white;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 10px 0;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ การจองถูกยกเลิก</h1>
              <p>เราเสียใจที่ต้องแจ้งข่าวไม่ดีนี้</p>
            </div>
            
            <div class="content">
              <p>เรียน <strong>${userName}</strong>,</p>
              <p>เราขออภัยในการแจ้งให้ทราบว่า การจองต่อไปนี้ได้ถูกยกเลิกแล้ว:</p>
              
              <div class="booking-card">
                <h3 style="margin: 0 0 10px 0; color: #1e293b;">
                  📋 รหัสการจอง: <span style="color: #ef4444;">${bookingData.bookingReference}</span>
                </h3>
                <span class="status-badge">ยกเลิกแล้ว</span>
              </div>
              
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>รายละเอียดการจองที่ยกเลิก:</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>โรงแรม: ${bookingData.hotelName}</li>
                  <li>ประเภทห้อง: ${bookingData.roomTypeName}</li>
                  <li>วันที่เข้าพัก: ${new Date(bookingData.checkInDate).toLocaleDateString('th-TH')}</li>
                  <li>วันที่ออก: ${new Date(bookingData.checkOutDate).toLocaleDateString('th-TH')}</li>
                  <li>จำนวนผู้เข้าพัก: ${bookingData.guests} คน</li>
                  <li>ราคารวม: ${bookingData.totalPrice?.toLocaleString('th-TH')} บาท</li>
                </ul>
              </div>
              
              <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #92400e;">💰 การคืนเงิน</h4>
                <p style="margin: 0; color: #92400e;">
                  หากคุณได้ชำระเงินแล้ว เราจะดำเนินการคืนเงินภายใน 7-14 วันทำการ กรุณาติดต่อเราหากต้องการข้อมูลเพิ่มเติม
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/rooms" class="button">
                  ค้นหาที่พักใหม่
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Hotel Booking System</strong></p>
              <p style="color: #666; font-size: 12px;">
                © 2025 Hotel Booking System. สงวนลิขสิทธิ์.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Booking cancellation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
    throw error;
  }
};

// ส่งอีเมลแจ้งเตือนการอัปเดตการจอง
const sendBookingUpdateEmail = async (userEmail, bookingData, updateDetails, userName = 'ผู้ใช้') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Hotel Booking System',
        address: process.env.GMAIL_USER
      },
      to: userEmail,
      subject: `🔄 การจองได้รับการอัปเดต - ${bookingData.hotelName}`,
      html: `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>การจองได้รับการอัปเดต</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .update-card {
              background: #fffbeb;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #f59e0b;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 10px 0;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 การจองได้รับการอัปเดต</h1>
              <p>ข้อมูลการจองของคุณมีการเปลี่ยนแปลง</p>
            </div>
            
            <div class="content">
              <p>เรียน <strong>${userName}</strong>,</p>
              <p>การจองรหัส <strong>${bookingData.bookingReference}</strong> ได้รับการอัปเดตแล้ว</p>
              
              <div class="update-card">
                <h3 style="margin: 0 0 15px 0; color: #92400e;">📝 รายละเอียดการเปลี่ยนแปลง:</h3>
                <p style="margin: 0; color: #92400e;">${updateDetails}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings" class="button">
                  ดูรายละเอียดการจอง
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Hotel Booking System</strong></p>
              <p style="color: #666; font-size: 12px;">
                © 2025 Hotel Booking System. สงวนลิขสิทธิ์.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Booking update email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending booking update email:', error);
    throw error;
  }
};

// ส่งอีเมลแจ้งเตือนการเข้าพักใกล้เคียง (Check-in Reminder)
const sendCheckInReminderEmail = async (userEmail, bookingData, userName = 'ผู้ใช้') => {
  try {
    const transporter = createTransporter();
    
    const checkInDate = new Date(bookingData.checkInDate);
    const formattedDate = checkInDate.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const mailOptions = {
      from: {
        name: 'Hotel Booking System',
        address: process.env.GMAIL_USER
      },
      to: userEmail,
      subject: `🏨 แจ้งเตือนการเข้าพัก - ${bookingData.hotelName}`,
      html: `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>แจ้งเตือนการเข้าพัก</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .reminder-card {
              background: #f0fdf4;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #10b981;
            }
            .checklist {
              background: #f8fafc;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 10px 0;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 เตรียมพร้อมสำหรับการเข้าพัก!</h1>
              <p>การเข้าพักของคุณใกล้เข้ามาแล้ว</p>
            </div>
            
            <div class="content">
              <p>เรียน <strong>${userName}</strong>,</p>
              <p>การเข้าพักของคุณที่ <strong>${bookingData.hotelName}</strong> จะถึงกำหนดในอีกไม่กี่วัน!</p>
              
              <div class="reminder-card">
                <h3 style="margin: 0 0 15px 0; color: #065f46;">📅 รายละเอียดการเข้าพัก:</h3>
                <ul style="margin: 0; color: #065f46; list-style: none; padding: 0;">
                  <li style="margin-bottom: 8px;">🏨 <strong>โรงแรม:</strong> ${bookingData.hotelName}</li>
                  <li style="margin-bottom: 8px;">🛏️ <strong>ห้อง:</strong> ${bookingData.roomTypeName}</li>
                  <li style="margin-bottom: 8px;">📅 <strong>วันเข้าพัก:</strong> ${formattedDate}</li>
                  <li style="margin-bottom: 8px;">⏰ <strong>เวลาเข้าพัก:</strong> 14:00 น.</li>
                  <li style="margin-bottom: 8px;">📋 <strong>รหัสการจอง:</strong> ${bookingData.bookingReference}</li>
                </ul>
              </div>
              
              <div class="checklist">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">✅ เตรียมเอกสารสำหรับเช็คอิน:</h3>
                <ul style="margin: 0; color: #4b5563; padding-left: 20px;">
                  <li>บัตรประชาชน หรือ หนังสือเดินทาง</li>
                  <li>ใบยืนยันการจอง (แสดงบนโทรศัพท์ได้)</li>
                  <li>บัตรเครดิต/เงินสด สำหรับค่ามัดจำ</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${bookingData.id || ''}" class="button">
                  ดูรายละเอียดการจอง
                </a>
              </div>
              
              <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #92400e;">📞 ติดต่อโรงแรมโดยตรง</h4>
                <p style="margin: 0; color: #92400e;">
                  หากต้องการเปลี่ยนแปลงข้อมูล หรือมีคำถามเพิ่มเติม กรุณาติดต่อโรงแรมโดยตรง หรือติดต่อเราได้ที่ support@hotelbooking.com
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Hotel Booking System</strong></p>
              <p style="color: #666; font-size: 12px;">
                © 2025 Hotel Booking System. สงวนลิขสิทธิ์.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Check-in reminder email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending check-in reminder email:', error);
    throw error;
  }
};

// ระบบส่งอีเมลแจ้งเตือนอัตโนมัติ
const sendAutomaticNotifications = {
  // ส่งทันทีเมื่อจองสำเร็จ
  onBookingCreated: async (bookingData, userData) => {
    try {
      const userName = `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ผู้ใช้';
      
      console.log('🚀 Auto-sending booking confirmation email...');
      await sendBookingConfirmationEmail(userData.email, bookingData, userName);
      console.log('✅ Booking confirmation email sent automatically');
    } catch (error) {
      console.error('❌ Failed to send automatic booking confirmation:', error);
    }
  },

  // ส่งเมื่อการจองถูกยกเลิก
  onBookingCancelled: async (bookingData, userData) => {
    try {
      const userName = `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ผู้ใช้';
      
      console.log('🚀 Auto-sending booking cancellation email...');
      await sendBookingCancellationEmail(userData.email, bookingData, userName);
      console.log('✅ Booking cancellation email sent automatically');
    } catch (error) {
      console.error('❌ Failed to send automatic booking cancellation:', error);
    }
  },

  // ส่งเมื่อมีการอัปเดตการจอง
  onBookingUpdated: async (bookingData, userData, updateDetails) => {
    try {
      const userName = `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ผู้ใช้';
      
      console.log('🚀 Auto-sending booking update email...');
      await sendBookingUpdateEmail(userData.email, bookingData, updateDetails, userName);
      console.log('✅ Booking update email sent automatically');
    } catch (error) {
      console.error('❌ Failed to send automatic booking update:', error);
    }
  },

  // ส่งแจ้งเตือนก่อนเข้าพัก 1 วัน
  checkInReminder: async (bookingData, userData) => {
    try {
      const userName = `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ผู้ใช้';
      
      console.log('🚀 Auto-sending check-in reminder email...');
      await sendCheckInReminderEmail(userData.email, bookingData, userName);
      console.log('✅ Check-in reminder email sent automatically');
    } catch (error) {
      console.error('❌ Failed to send automatic check-in reminder:', error);
    }
  }
};

export {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetConfirmation,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendBookingUpdateEmail,
  sendCheckInReminderEmail,
  sendAutomaticNotifications
};
