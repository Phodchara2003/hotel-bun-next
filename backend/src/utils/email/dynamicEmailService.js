// Dynamic Email Service - ใช้ Email settings ของแต่ละ User
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

/**
 * สร้าง Email Transporter สำหรับ User แต่ละคน
 */
async function createUserTransporter(userId) {
  try {
    // ดึงการตั้งค่าของ User
    const settings = await sql`
      SELECT email, app_password, smtp_host, smtp_port, provider
      FROM user_email_settings 
      WHERE user_id = ${userId} AND is_verified = true
    `;

    if (!settings[0]) {
      throw new Error('ไม่พบการตั้งค่าอีเมลของผู้ใช้');
    }

    // Decrypt app password
    // Note: ในการใช้งานจริงควรใช้ encryption แทน bcrypt สำหรับ reversible data
    // ที่นี่เราจะเก็บเป็น plain text ใน production ควรใช้ crypto.encrypt
    
    const userSettings = settings[0];
    const transporter = nodemailer.createTransporter({
      host: userSettings.smtp_host,
      port: userSettings.smtp_port,
      secure: userSettings.smtp_port === 465,
      auth: {
        user: userSettings.email,
        pass: userSettings.app_password // ใน production ควร decrypt
      }
    });

    return {
      transporter,
      fromEmail: userSettings.email,
      provider: userSettings.provider
    };

  } catch (error) {
    console.error('Error creating user transporter:', error);
    throw error;
  }
}

/**
 * ส่ง OTP ผ่าน Email ของ User เอง
 */
async function sendOTPWithUserEmail(userId, toEmail, otp, userName) {
  try {
    const { transporter, fromEmail } = await createUserTransporter(userId);

    const mailOptions = {
      from: `"Hotel Booking System" <${fromEmail}>`,
      to: toEmail,
      subject: '🔐 รหัส OTP สำหรับรีเซ็ตรหัสผ่าน',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>รหัส OTP</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">🏨 Hotel Booking</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">รหัส OTP สำหรับรีเซ็ตรหัสผ่าน</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #333; margin-bottom: 20px;">สวัสดี ${userName}</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                คุณได้ทำการขอรีเซ็ตรหัสผ่าน กรุณาใช้รหัส OTP ด้านล่างเพื่อยืนยันตัวตน
              </p>

              <!-- OTP Box -->
              <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="color: #666; margin: 0 0 10px 0; font-size: 16px;">รหัส OTP ของคุณ</p>
                <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
                <p style="color: #999; margin: 10px 0 0 0; font-size: 14px;">
                  รหัสนี้จะหมดอายุใน 10 นาที
                </p>
              </div>

              <!-- Warning -->
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  ⚠️ <strong>คำเตือน:</strong> ห้ามแชร์รหัสนี้กับผู้อื่น หากคุณไม่ได้ทำการขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้
                </p>
              </div>

              <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                หากคุณมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อทีมสนับสนุนของเรา
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; margin: 0; font-size: 14px;">
                © 2025 Hotel Booking System. สงวนลิขสิทธิ์
              </p>
              <p style="color: #6c757d; margin: 5px 0 0 0; font-size: 12px;">
                อีเมลนี้ส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
      fromEmail: fromEmail
    };

  } catch (error) {
    console.error('Error sending OTP with user email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ส่งอีเมลทดสอบ
 */
async function sendTestEmail(settings) {
  try {
    const transporter = nodemailer.createTransporter({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.smtp_port === 465,
      auth: {
        user: settings.email,
        pass: settings.app_password
      }
    });

    // ทดสอบการเชื่อมต่อ
    await transporter.verify();

    // ส่งอีเมลทดสอบ
    const mailOptions = {
      from: `"Hotel Booking System" <${settings.email}>`,
      to: settings.email, // ส่งให้ตัวเอง
      subject: '✅ ทดสอบการตั้งค่าอีเมล - Hotel Booking System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #667eea;">🎉 การตั้งค่าอีเมลสำเร็จ!</h2>
          <p>ยินดีด้วย! ระบบส่งอีเมลของคุณพร้อมใช้งานแล้ว</p>
          <p><strong>การตั้งค่า:</strong></p>
          <ul>
            <li>Email: ${settings.email}</li>
            <li>SMTP Host: ${settings.smtp_host}</li>
            <li>Port: ${settings.smtp_port}</li>
          </ul>
          <p>ตอนนี้คุณสามารถใช้ฟีเจอร์ "ลืมรหัสผ่าน" ได้แล้ว</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Hotel Booking System - ${new Date().toLocaleString('th-TH')}
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error) {
    console.error('Error sending test email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ฟอลล์แบ็กไปใช้ System Email หากผู้ใช้ยังไม่ตั้งค่า
 */
async function sendOTPWithFallback(userId, toEmail, otp, userName) {
  try {
    // ลองใช้ Email ของ User ก่อน
    const userResult = await sendOTPWithUserEmail(userId, toEmail, otp, userName);
    
    if (userResult.success) {
      return userResult;
    }

    // หากไม่สำเร็จ ใช้ System Email
    console.log('User email failed, falling back to system email');
    const { sendOTPEmail } = await import('./emailService.js');
    return await sendOTPEmail(toEmail, otp, userName);

  } catch (error) {
    console.error('Error in fallback email:', error);
    
    // ฟอลล์แบ็กสุดท้าย - ใช้ System Email
    const { sendOTPEmail } = await import('./emailService.js');
    return await sendOTPEmail(toEmail, otp, userName);
  }
}

export {
  createUserTransporter,
  sendOTPWithUserEmail,
  sendTestEmail,
  sendOTPWithFallback
};
