import { Elysia } from 'elysia';
import bcrypt from 'bcryptjs';
import { generateOTP, sendOTPEmail, sendPasswordResetConfirmation } from '../utils/emailService.js';
import { sendOTPWithFallback } from '../utils/dynamicEmailService.js';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

// Store OTP temporarily (ในการใช้งานจริงควรใช้ Redis หรือ Database)
const otpStore = new Map();

const forgotPasswordRoutes = new Elysia({ prefix: '/auth' })
  
  // ส่ง OTP ไปยัง Email
  .post('/forgot-password', async ({ body, set }) => {
    try {
      const { email } = body;

      if (!email) {
        set.status = 400;
        return { success: false, message: 'กรุณาใส่อีเมล' };
      }

      // ตรวจสอบว่ามี email ในระบบหรือไม่
      const users = await sql`
        SELECT id, email, first_name, last_name 
        FROM users 
        WHERE email = ${email} AND role IN ('user', 'admin')
      `;
      
      const user = users[0];

      if (!user) {
        set.status = 404;
        return { success: false, message: 'ไม่พบอีเมลในระบบ' };
      }

      // สร้าง OTP
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 นาที

      // เก็บ OTP ใน memory (ควรใช้ Redis ในการใช้งานจริง)
      otpStore.set(email, {
        otp,
        expiresAt,
        userId: user.id,
        attempts: 0
      });

      // ส่ง OTP ผ่าน Email (ลองใช้ Email ของ User ก่อน แล้วถึง System Email)
      const userName = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'ผู้ใช้';
      const emailResult = await sendOTPWithFallback(user.id, email, otp, userName);

      if (!emailResult.success) {
        set.status = 500;
        return { success: false, message: 'ไม่สามารถส่งอีเมลได้' };
      }

      // Log สำหรับ development (ลบออกใน production)
      console.log(`OTP for ${email}: ${otp}`);

      return { 
        success: true, 
        message: 'ส่งรหัส OTP ไปยังอีเมลแล้ว',
        expiresIn: 600 // 10 นาที
      };

    } catch (error) {
      console.error('Error in forgot-password:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' };
    }
  })

  // ยืนยัน OTP
  .post('/verify-otp', async ({ body, set }) => {
    try {
      const { email, otp } = body;

      if (!email || !otp) {
        set.status = 400;
        return { success: false, message: 'กรุณาใส่อีเมลและรหัส OTP' };
      }

      // ตรวจสอบ OTP
      const storedOTP = otpStore.get(email);

      if (!storedOTP) {
        set.status = 404;
        return { success: false, message: 'ไม่พบรหัส OTP หรือหมดอายุแล้ว' };
      }

      // ตรวจสอบการหมดอายุ
      if (Date.now() > storedOTP.expiresAt) {
        otpStore.delete(email);
        set.status = 400;
        return { success: false, message: 'รหัส OTP หมดอายุแล้ว' };
      }

      // ตรวจสอบจำนวนครั้งที่ลองผิด
      if (storedOTP.attempts >= 5) {
        otpStore.delete(email);
        set.status = 429;
        return { success: false, message: 'ลองใส่รหัส OTP ผิดหลายครั้งเกินไป' };
      }

      // ตรวจสอบรหัส OTP
      if (storedOTP.otp !== otp) {
        storedOTP.attempts += 1;
        otpStore.set(email, storedOTP);
        
        set.status = 400;
        return { 
          success: false, 
          message: `รหัส OTP ไม่ถูกต้อง (เหลือ ${5 - storedOTP.attempts} ครั้ง)` 
        };
      }

      // OTP ถูกต้อง - ทำเครื่องหมายว่าได้รับการยืนยันแล้ว
      storedOTP.verified = true;
      otpStore.set(email, storedOTP);

      return { 
        success: true, 
        message: 'ยืนยัน OTP สำเร็จ',
        canResetPassword: true
      };

    } catch (error) {
      console.error('Error in verify-otp:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' };
    }
  })

  // รีเซ็ตรหัสผ่าน
  .post('/reset-password', async ({ body, set }) => {
    try {
      const { email, otp, newPassword } = body;

      if (!email || !otp || !newPassword) {
        set.status = 400;
        return { success: false, message: 'กรุณาใส่ข้อมูลให้ครบถ้วน' };
      }

      if (newPassword.length < 6) {
        set.status = 400;
        return { success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' };
      }

      // ตรวจสอบ OTP อีกครั้ง
      const storedOTP = otpStore.get(email);

      if (!storedOTP || !storedOTP.verified || storedOTP.otp !== otp) {
        set.status = 400;
        return { success: false, message: 'รหัส OTP ไม่ถูกต้องหรือยังไม่ได้รับการยืนยัน' };
      }

      if (Date.now() > storedOTP.expiresAt) {
        otpStore.delete(email);
        set.status = 400;
        return { success: false, message: 'รหัส OTP หมดอายุแล้ว' };
      }

      // เข้ารหัสรหัสผ่านใหม่
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // อัพเดทรหัสผ่านในฐานข้อมูล
      await sql`
        UPDATE users 
        SET password = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${storedOTP.userId}
      `;

      // ลบ OTP ออกจาก store
      otpStore.delete(email);

      // ส่งอีเมลยืนยัน
      const users = await sql`
        SELECT first_name, last_name FROM users WHERE id = ${storedOTP.userId}
      `;
      
      const user = users[0];

      const userName = user && user.first_name ? 
        `${user.first_name} ${user.last_name || ''}`.trim() : 
        'ผู้ใช้';

      await sendPasswordResetConfirmation(email, userName);

      return { 
        success: true, 
        message: 'เปลี่ยนรหัสผ่านสำเร็จ' 
      };

    } catch (error) {
      console.error('Error in reset-password:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' };
    }
  })

  // ส่ง OTP ใหม่
  .post('/resend-otp', async ({ body, set }) => {
    try {
      const { email } = body;

      if (!email) {
        set.status = 400;
        return { success: false, message: 'กรุณาใส่อีเมล' };
      }

      // ตรวจสอบว่ามี session การขอ OTP อยู่หรือไม่
      const existingOTP = otpStore.get(email);
      if (!existingOTP) {
        set.status = 404;
        return { success: false, message: 'ไม่พบการขอรีเซ็ตรหัสผ่าน กรุณาเริ่มใหม่' };
      }

      // ตรวจสอบ rate limiting (ส่งได้ทุก 60 วินาที)
      const lastSent = existingOTP.lastSent || 0;
      if (Date.now() - lastSent < 60000) {
        const waitTime = Math.ceil((60000 - (Date.now() - lastSent)) / 1000);
        set.status = 429;
        return { 
          success: false, 
          message: `กรุณารอ ${waitTime} วินาที ก่อนส่ง OTP ใหม่` 
        };
      }

      // สร้าง OTP ใหม่
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 นาที

      // อัพเดท OTP
      otpStore.set(email, {
        ...existingOTP,
        otp,
        expiresAt,
        attempts: 0,
        verified: false,
        lastSent: Date.now()
      });

      // ดึงข้อมูลผู้ใช้
      const users = await sql`
        SELECT first_name, last_name FROM users WHERE id = ${existingOTP.userId}
      `;
      
      const user = users[0];

      const userName = user && user.first_name ? 
        `${user.first_name} ${user.last_name || ''}`.trim() : 
        'ผู้ใช้';

      // ส่ง OTP ผ่าน Email (ลองใช้ Email ของ User ก่อน แล้วถึง System Email)
      const emailResult = await sendOTPWithFallback(existingOTP.userId, email, otp, userName);

      if (!emailResult.success) {
        set.status = 500;
        return { success: false, message: 'ไม่สามารถส่งอีเมลได้' };
      }

      // Log สำหรับ development
      console.log(`New OTP for ${email}: ${otp}`);

      return { 
        success: true, 
        message: 'ส่งรหัส OTP ใหม่แล้ว',
        expiresIn: 600
      };

    } catch (error) {
      console.error('Error in resend-otp:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' };
    }
  })

  // ตรวจสอบสถานะ OTP
  .get('/otp-status/:email', async ({ params, set }) => {
    try {
      const { email } = params;
      const storedOTP = otpStore.get(email);

      if (!storedOTP) {
        return { 
          exists: false,
          message: 'ไม่พบการขอรีเซ็ตรหัสผ่าน'
        };
      }

      const isExpired = Date.now() > storedOTP.expiresAt;
      const timeRemaining = Math.max(0, Math.ceil((storedOTP.expiresAt - Date.now()) / 1000));

      return {
        exists: true,
        expired: isExpired,
        verified: storedOTP.verified || false,
        attempts: storedOTP.attempts || 0,
        maxAttempts: 5,
        timeRemaining: timeRemaining
      };

    } catch (error) {
      console.error('Error in otp-status:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' };
    }
  });

export default forgotPasswordRoutes;
