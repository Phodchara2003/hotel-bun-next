// backend/routes/users/check-email.js
const express = require('express');
const db = require('../../utils/db');
const router = express.Router();

// ตรวจสอบว่าอีเมลมีอยู่ในระบบหรือไม่
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        message: 'กรุณากรอกอีเมล' 
      });
    }
    
    // ค้นหา user ที่มีอีเมลนี้
    const query = 'SELECT id, email FROM users WHERE email = ?';
    const [results] = await db.execute(query, [email]);
    
    if (results.length === 0) {
      return res.status(404).json({ 
        message: 'ไม่พบอีเมลนี้ในระบบ' 
      });
    }
    
    res.json({
      message: 'พบอีเมลในระบบ',
      exists: true,
      user: {
        id: results[0].id,
        email: results[0].email
      }
    });
    
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล' 
    });
  }
});

module.exports = router;
