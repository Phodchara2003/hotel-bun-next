import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Hotel Booking Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API endpoint working',
    data: {
      server: 'Express with Node.js',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Hotel endpoints
app.get('/api/hotels', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Grand Hotel Bangkok',
        description: 'Luxury hotel in the heart of Bangkok',
        address: '123 Sukhumvit Road, Bangkok',
        rating: 4.5,
        price_range: '1000-3000'
      },
      {
        id: 2,
        name: 'Seaside Resort Phuket',
        description: 'Beautiful beachfront resort',
        address: '456 Patong Beach, Phuket',
        rating: 4.8,
        price_range: '2000-5000'
      }
    ]
  });
});

app.get('/api/rooms', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        hotel_id: 1,
        type: 'Standard Room',
        price: 1500,
        available: true
      },
      {
        id: 2,
        hotel_id: 1,
        type: 'Deluxe Room',
        price: 2500,
        available: true
      }
    ]
  });
});

// Forgot Password API endpoints
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Mock user database (ในการใช้งานจริงควรใช้ฐานข้อมูลจริง)
const users = [];
const resetTokens = new Map();

// ตรวจสอบ reset token
app.post('/api/auth/verify-reset-token', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return res.status(400).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' });
    }
    
    // เช็คว่า token หมดอายุหรือไม่
    if (Date.now() > tokenData.expires) {
      resetTokens.delete(token);
      return res.status(400).json({ message: 'Token หมดอายุแล้ว' });
    }
    
    res.json({
      message: 'Token ถูกต้อง',
      email: tokenData.email,
      success: true
    });
    
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบ token' });
  }
});

// อัพเดทรหัสผ่าน
app.post('/api/auth/update-password', (req, res) => {
  try {
    const { email, password, token } = req.body;
    
    if (!email || !password || !token) {
      return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
    }
    
    const tokenData = resetTokens.get(token);
    
    if (!tokenData || tokenData.email !== email) {
      return res.status(400).json({ message: 'Token ไม่ถูกต้อง' });
    }
    
    // ลบ token หลังใช้งาน
    resetTokens.delete(token);
    
    // ในการใช้งานจริง ต้องอัพเดทรหัสผ่านในฐานข้อมูล
    console.log(`✅ Password updated for ${email}`);
    
    res.json({
      message: 'อัพเดทรหัสผ่านเรียบร้อย',
      success: true
    });
    
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดทรหัสผ่าน' });
  }
});

// บันทึก reset token (สำหรับ frontend forgot-password)
app.post('/api/auth/save-reset-token', (req, res) => {
  try {
    const { email, resetToken, resetTokenExpires } = req.body;
    
    // บันทึก token พร้อมข้อมูล
    resetTokens.set(resetToken, {
      email,
      expires: resetTokenExpires,
      created: Date.now()
    });
    
    console.log(`✅ Reset token saved for ${email}`);
    
    res.json({ 
      message: 'บันทึก reset token เรียบร้อย',
      success: true 
    });
    
  } catch (error) {
    console.error('Save reset token error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึก token' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Hotel Backend Server is running at http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('   GET /        - Server info');
  console.log('   GET /health  - Health check');
  console.log('   GET /api/test - API test');
  console.log('   GET /api/hotels - Hotels list');
  console.log('   GET /api/rooms - Rooms list');
});