// User's Own Email Configuration System
import { Elysia } from 'elysia';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

const userEmailRoutes = new Elysia({ prefix: '/user-email' })

  // ดูการตั้งค่า Email ของ User
  .get('/settings', async ({ headers, set }) => {
    try {
      // ดึง userId จาก JWT token (จำเป็นต้องมี middleware auth)
      const userId = headers.user?.id; // สมมติว่ามี auth middleware
      
      if (!userId) {
        set.status = 401;
        return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
      }

      const settings = await sql`
        SELECT provider, email, smtp_host, smtp_port, is_verified, created_at
        FROM user_email_settings 
        WHERE user_id = ${userId}
      `;

      return {
        success: true,
        settings: settings[0] || null,
        hasSettings: !!settings[0]
      };

    } catch (error) {
      console.error('Error getting email settings:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาด' };
    }
  })

  // ตั้งค่า Email Configuration
  .post('/configure', async ({ body, headers, set }) => {
    try {
      const userId = headers.user?.id;
      
      if (!userId) {
        set.status = 401;
        return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
      }

      const { provider, email, appPassword, smtpHost, smtpPort } = body;

      if (!email || !appPassword) {
        set.status = 400;
        return { success: false, message: 'กรุณากรอกข้อมูลให้ครบ' };
      }

      // เข้ารหัส App Password
      const encryptedPassword = await bcrypt.hash(appPassword, 12);

      // บันทึกการตั้งค่า
      await sql`
        INSERT INTO user_email_settings 
        (user_id, provider, email, app_password, smtp_host, smtp_port, updated_at)
        VALUES (${userId}, ${provider || 'gmail'}, ${email}, ${encryptedPassword}, ${smtpHost || 'smtp.gmail.com'}, ${smtpPort || 587}, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          provider = ${provider || 'gmail'},
          email = ${email},
          app_password = ${encryptedPassword},
          smtp_host = ${smtpHost || 'smtp.gmail.com'},
          smtp_port = ${smtpPort || 587},
          updated_at = CURRENT_TIMESTAMP
      `;

      return {
        success: true,
        message: 'ตั้งค่าอีเมลสำเร็จ'
      };

    } catch (error) {
      console.error('Error configuring email:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาด' };
    }
  })

  // ทดสอบการส่งอีเมล
  .post('/test', async ({ headers, set }) => {
    try {
      const userId = headers.user?.id;
      
      if (!userId) {
        set.status = 401;
        return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
      }

      // ดึงการตั้งค่าของ User
      const settings = await sql`
        SELECT email, app_password, smtp_host, smtp_port
        FROM user_email_settings 
        WHERE user_id = ${userId}
      `;

      if (!settings[0]) {
        set.status = 404;
        return { success: false, message: 'ยังไม่ได้ตั้งค่าอีเมล' };
      }

      // ทดสอบส่งอีเมล (ใช้ library ที่สร้าง dynamic transporter)
      const { sendTestEmail } = await import('../utils/dynamicEmailService.js');
      const result = await sendTestEmail(settings[0]);

      if (result.success) {
        // อัพเดทสถานะเป็น verified
        await sql`
          UPDATE user_email_settings 
          SET is_verified = true, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `;

        return {
          success: true,
          message: 'ทดสอบส่งอีเมลสำเร็จ'
        };
      } else {
        return {
          success: false,
          message: 'ทดสอบส่งอีเมลไม่สำเร็จ: ' + result.error
        };
      }

    } catch (error) {
      console.error('Error testing email:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาด' };
    }
  })

  // ลบการตั้งค่า Email
  .delete('/settings', async ({ headers, set }) => {
    try {
      const userId = headers.user?.id;
      
      if (!userId) {
        set.status = 401;
        return { success: false, message: 'กรุณาเข้าสู่ระบบ' };
      }

      await sql`DELETE FROM user_email_settings WHERE user_id = ${userId}`;

      return {
        success: true,
        message: 'ลบการตั้งค่าอีเมลสำเร็จ'
      };

    } catch (error) {
      console.error('Error deleting email settings:', error);
      set.status = 500;
      return { success: false, message: 'เกิดข้อผิดพลาด' };
    }
  });

export default userEmailRoutes;
