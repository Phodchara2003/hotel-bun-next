// backend/routes/auth/forgot-password.js
const express = require('express');
const crypto = require('crypto');
const db = require('../../utils/db');
const router = express.Router();

// บันทึก reset token
router.post('/save-reset-token', async (req, res) => {
  try {
    const { email, resetToken, resetTokenExpires } = req.body;
    
    // อัพเดท user ด้วย reset token
    const updateQuery = `
      UPDATE users 
      SET reset_token = ?, reset_token_expires = ? 
      WHERE email = ?
    `;
    
    await db.execute(updateQuery, [resetToken, resetTokenExpires, email]);
    
    res.json({ 
      message: 'บันทึก reset token เรียบร้อย',
      success: true 
    });
    
  } catch (error) {
    console.error('Save reset token error:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการบันทึก token' 
    });
  }
});

// ตรวจสอบ reset token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    // ค้นหา user ที่มี token และยังไม่หมดอายุ
    const query = `
      SELECT email, reset_token_expires 
      FROM users 
      WHERE reset_token = ? AND reset_token_expires > NOW()
    `;
    
    const [results] = await db.execute(query, [token]);
    
    if (results.length === 0) {
      return res.status(400).json({ 
        message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' 
      });
    }
    
    res.json({
      message: 'Token ถูกต้อง',
      email: results[0].email,
      success: true
    });
    
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการตรวจสอบ token' 
    });
  }
});

// อัพเดทรหัสผ่าน
router.post('/update-password', async (req, res) => {
  try {
    const { email, password, token } = req.body;
    
    // อัพเดทรหัสผ่านและลบ reset token
    const updateQuery = `
      UPDATE users 
      SET password = ?, reset_token = NULL, reset_token_expires = NULL 
      WHERE email = ? AND reset_token = ?
    `;
    
    const [result] = await db.execute(updateQuery, [password, email, token]);
    
    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        message: 'ไม่สามารถอัพเดทรหัสผ่านได้' 
      });
    }
    
    res.json({
      message: 'อัพเดทรหัสผ่านเรียบร้อย',
      success: true
    });
    
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการอัพเดทรหัสผ่าน' 
    });
  }
});

module.exports = router;
