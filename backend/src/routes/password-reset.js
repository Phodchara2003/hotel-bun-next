import { Elysia, t } from 'elysia';
import { db } from '../db/sqlite.js';

export const passwordResetRoutes = new Elysia({ prefix: '/auth' })
  
  // ตรวจสอบว่าอีเมลมีอยู่ในระบบหรือไม่
  .post('/check-email', async ({ body, set }) => {
    try {
      console.log('Checking email:', body.email);
      
      if (!body.email) {
        set.status = 400;
        return { message: 'กรุณากรอกอีเมล' };
      }
      
      const stmt = db.prepare('SELECT id, email FROM users WHERE email = ?');
      const user = stmt.get(body.email);
      
      if (!user) {
        set.status = 404;
        return { message: 'ไม่พบอีเมลนี้ในระบบ' };
      }
      
      return {
        message: 'พบอีเมลในระบบ',
        exists: true,
        user: {
          id: user.id,
          email: user.email
        }
      };
      
    } catch (error) {
      console.error('Check email error:', error);
      set.status = 500;
      return { message: 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล' };
    }
  }, {
    body: t.Object({
      email: t.String()
    })
  })
  
  // บันทึก reset token
  .post('/save-reset-token', async ({ body, set }) => {
    try {
      console.log('Saving reset token for:', body.email);
      
      const { email, resetToken, resetTokenExpires } = body;
      
      // อัพเดท user ด้วย reset token
      const stmt = db.prepare(`
        UPDATE users 
        SET reset_token = ?, reset_token_expires = ? 
        WHERE email = ?
      `);
      
      const result = stmt.run(resetToken, resetTokenExpires, email);
      
      if (result.changes === 0) {
        set.status = 404;
        return { message: 'ไม่พบผู้ใช้งานดังกล่าว' };
      }
      
      return { 
        message: 'บันทึก reset token เรียบร้อย',
        success: true 
      };
      
    } catch (error) {
      console.error('Save reset token error:', error);
      set.status = 500;
      return { message: 'เกิดข้อผิดพลาดในการบันทึก token' };
    }
  }, {
    body: t.Object({
      email: t.String(),
      resetToken: t.String(),
      resetTokenExpires: t.String()
    })
  })
  
  // ตรวจสอบ reset token
  .post('/verify-reset-token', async ({ body, set }) => {
    try {
      console.log('Verifying reset token...');
      
      const { token } = body;
      
      // ค้นหา user ที่มี token และยังไม่หมดอายุ
      const stmt = db.prepare(`
        SELECT email, reset_token_expires 
        FROM users 
        WHERE reset_token = ? AND datetime(reset_token_expires) > datetime('now')
      `);
      
      const user = stmt.get(token);
      
      if (!user) {
        set.status = 400;
        return { message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' };
      }
      
      return {
        message: 'Token ถูกต้อง',
        email: user.email,
        success: true
      };
      
    } catch (error) {
      console.error('Verify reset token error:', error);
      set.status = 500;
      return { message: 'เกิดข้อผิดพลาดในการตรวจสอบ token' };
    }
  }, {
    body: t.Object({
      token: t.String()
    })
  })
  
  // อัพเดทรหัสผ่าน
  .post('/update-password', async ({ body, set }) => {
    try {
      console.log('Updating password...');
      
      const { email, password, token } = body;
      
      // อัพเดทรหัสผ่านและลบ reset token
      const stmt = db.prepare(`
        UPDATE users 
        SET password = ?, reset_token = NULL, reset_token_expires = NULL 
        WHERE email = ? AND reset_token = ?
      `);
      
      const result = stmt.run(password, email, token);
      
      if (result.changes === 0) {
        set.status = 400;
        return { message: 'ไม่สามารถอัพเดทรหัสผ่านได้' };
      }
      
      return {
        message: 'อัพเดทรหัสผ่านเรียบร้อย',
        success: true
      };
      
    } catch (error) {
      console.error('Update password error:', error);
      set.status = 500;
      return { message: 'เกิดข้อผิดพลาดในการอัพเดทรหัสผ่าน' };
    }
  }, {
    body: t.Object({
      email: t.String(),
      password: t.String(),
      token: t.String()
    })
  });

export default passwordResetRoutes;
