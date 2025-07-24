import { Elysia } from 'elysia';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import jwt from 'jsonwebtoken';
import { generateOTP, sendOTPEmail } from '../utils/emailService.js';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

// Store pending email changes temporarily
const pendingEmailChanges = new Map();

const changeEmailRoutes = new Elysia({ prefix: '/auth' })

  // ขั้นตอนที่ 1: ขอเปลี่ยนอีเมล
  .post('/request-email-change', async ({ headers, body, set }) => {
    try {
      // Authenticate user
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      const { newEmail, currentPassword } = body;

      if (!newEmail || !currentPassword) {
        set.status = 400;
        return { success: false, message: 'กรุณากรอกข้อมูลให้ครบ' };
      }

      // ตรวจสอบรหัสผ่านปัจจุบัน
      const users = await sql`
        SELECT id, email, password FROM users WHERE id = ${userId}
      `;

      if (users.length === 0) {
        set.status = 404;
        return { success: false, message: 'ไม่พบผู้ใช้' };
      }

      const user = users[0];
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);

      if (!isValidPassword) {
        set.status = 400;
        return { success: false, message: 'รหัสผ่านไม่ถูกต้อง' };
      }

      // ตรวจสอบว่าอีเมลใหม่ไม่ซ้ำกับผู้อื่น
      const existingUsers = await sql`
        SELECT id FROM users WHERE email = ${newEmail} AND id != ${userId}
      `;

      if (existingUsers.length > 0) {
        set.status = 400;
        return { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' };
      }

      // สร้าง OTP สำหรับอีเมลเก่า
      const oldEmailOTP = generateOTP();
      const newEmailOTP = generateOTP();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 นาที

      // เก็บข้อมูลการเปลี่ยนอีเมลชั่วคราว
      pendingEmailChanges.set(userId, {
        oldEmail: user.email,
        newEmail: newEmail,
        oldEmailOTP: oldEmailOTP,
        newEmailOTP: newEmailOTP,
        expiresAt: expiresAt,
        oldEmailVerified: false,
        newEmailVerified: false,
        attempts: 0
      });

      // ส่ง OTP ไปยังอีเมลเก่า
      const oldEmailResult = await sendOTPEmail(
        user.email, 
        oldEmailOTP, 
        'ผู้ใช้',
        'ยืนยันการเปลี่ยนอีเมล'
      );

      // ส่ง OTP ไปยังอีเมลใหม่
      const newEmailResult = await sendOTPEmail(
        newEmail, 
        newEmailOTP, 
        'ผู้ใช้',
        'ยืนยันอีเมลใหม่'
      );

      if (!oldEmailResult.success || !newEmailResult.success) {
        set.status = 500;
        return { success: false, message: 'ไม่สามารถส่งอีเมลยืนยันได้' };
      }

      return {
        success: true,
        message: 'ส่งรหัสยืนยันไปยังอีเมลเก่าและใหม่แล้ว',
        expiresIn: 900 // 15 นาที
      };

    } catch (error) {
      console.error('Error in request-email-change:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' };
    }
  })

  // ขั้นตอนที่ 2: ยืนยัน OTP อีเมลเก่า
  .post('/verify-old-email', async ({ headers, body, set }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      const { otp } = body;

      const pendingChange = pendingEmailChanges.get(userId);
      if (!pendingChange) {
        set.status = 404;
        return { success: false, message: 'ไม่พบการขอเปลี่ยนอีเมล' };
      }

      if (Date.now() > pendingChange.expiresAt) {
        pendingEmailChanges.delete(userId);
        set.status = 400;
        return { success: false, message: 'รหัสยืนยันหมดอายุแล้ว' };
      }

      if (pendingChange.oldEmailOTP !== otp) {
        pendingChange.attempts += 1;
        if (pendingChange.attempts >= 5) {
          pendingEmailChanges.delete(userId);
          set.status = 429;
          return { success: false, message: 'ลองผิดหลายครั้งเกินไป' };
        }
        set.status = 400;
        return { success: false, message: 'รหัสยืนยันไม่ถูกต้อง' };
      }

      // ทำเครื่องหมายว่ายืนยันอีเมลเก่าแล้ว
      pendingChange.oldEmailVerified = true;
      pendingEmailChanges.set(userId, pendingChange);

      return {
        success: true,
        message: 'ยืนยันอีเมลเก่าสำเร็จ กรุณายืนยันอีเมลใหม่',
        nextStep: 'verify-new-email'
      };

    } catch (error) {
      console.error('Error in verify-old-email:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' };
    }
  })

  // ขั้นตอนที่ 3: ยืนยัน OTP อีเมลใหม่
  .post('/verify-new-email', async ({ headers, body, set }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      const { otp } = body;

      const pendingChange = pendingEmailChanges.get(userId);
      if (!pendingChange) {
        set.status = 404;
        return { success: false, message: 'ไม่พบการขอเปลี่ยนอีเมล' };
      }

      if (!pendingChange.oldEmailVerified) {
        set.status = 400;
        return { success: false, message: 'กรุณายืนยันอีเมลเก่าก่อน' };
      }

      if (Date.now() > pendingChange.expiresAt) {
        pendingEmailChanges.delete(userId);
        set.status = 400;
        return { success: false, message: 'รหัสยืนยันหมดอายุแล้ว' };
      }

      if (pendingChange.newEmailOTP !== otp) {
        pendingChange.attempts += 1;
        if (pendingChange.attempts >= 5) {
          pendingEmailChanges.delete(userId);
          set.status = 429;
          return { success: false, message: 'ลองผิดหลายครั้งเกินไป' };
        }
        set.status = 400;
        return { success: false, message: 'รหัสยืนยันไม่ถูกต้อง' };
      }

      // อัพเดทอีเมลในฐานข้อมูล
      await sql`
        UPDATE users 
        SET email = ${pendingChange.newEmail}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
      `;

      // ลบข้อมูลชั่วคราว
      pendingEmailChanges.delete(userId);

      // ส่งอีเมลยืนยันการเปลี่ยนแปลง
      await sendOTPEmail(
        pendingChange.newEmail,
        '✅',
        'ผู้ใช้',
        'เปลี่ยนอีเมลสำเร็จ'
      );

      return {
        success: true,
        message: 'เปลี่ยนอีเมลสำเร็จ',
        newEmail: pendingChange.newEmail
      };

    } catch (error) {
      console.error('Error in verify-new-email:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' };
    }
  })

  // ยกเลิกการเปลี่ยนอีเมล
  .post('/cancel-email-change', async ({ headers, set }) => {
    try {
      const authHeader = headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      pendingEmailChanges.delete(userId);

      return {
        success: true,
        message: 'ยกเลิกการเปลี่ยนอีเมลแล้ว'
      };

    } catch (error) {
      console.error('Error in cancel-email-change:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' };
    }
  });

export default changeEmailRoutes;
