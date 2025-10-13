/**
 * ทดสอบการส่งอีเมลแจ้งเตือนไปยัง hotelsystem.rmu.ac.th@gmail.com
 */

const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

// MySQL Connection Configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// กำหนดค่า SMTP สำหรับ Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hotelsystem.rmu.ac.th@gmail.com',
      pass: 'omqi tddz vubp wakz'
    }
  });
};

// เทมเพลตอีเมลแจ้งเตือนการจองใหม่
const getTestEmailTemplate = () => {
  return {
    subject: '🧪 ทดสอบระบบแจ้งเตือนอีเมลแอดมิน - hotelsystem.rmu.ac.th@gmail.com',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">✅ ระบบแจ้งเตือนพร้อมใช้งาน!</h1>
          <p style="margin: 10px 0 0 0;">โรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0;">📧 การตั้งค่าอีเมลระบบ</h2>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #1e40af;"><strong>✅ อีเมลระบบหลัก:</strong> hotelsystem.rmu.ac.th@gmail.com</p>
          </div>
          
          <h3 style="color: #374151;">🔔 ประเภทการแจ้งเตือนที่จะได้รับ:</h3>
          <ul style="color: #4b5563; line-height: 1.6;">
            <li>🆕 <strong>การจองใหม่:</strong> เมื่อลูกค้าทำการจองห้องพัก</li>
            <li>💰 <strong>การชำระเงิน:</strong> เมื่อลูกค้าอัปโหลดสลิปการชำระเงิน</li>
            <li>🚫 <strong>การยกเลิก:</strong> เมื่อมีการยกเลิกการจองหรือคำขอยกเลิก</li>
          </ul>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>📱 การแจ้งเตือนจะทำงานอัตโนมัติ</strong><br>
            ไม่ต้องตั้งค่าเพิ่มเติม ระบบจะส่งอีเมลทันทีเมื่อเกิดเหตุการณ์</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            <strong>เวลาทดสอบ:</strong> ${new Date().toLocaleString('th-TH')}<br>
            <strong>สถานะ:</strong> ระบบพร้อมใช้งาน ✅
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; background-color: #f9fafb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม<br>
            พัฒนาโดย นาย พชร มีหา © 2025
          </p>
        </div>
      </div>
    `
  };
};

async function testSystemEmailNotification() {
  let connection = null;
  
  try {
    console.log('🔍 เชื่อมต่อกับฐานข้อมูล...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📧 ทดสอบการส่งอีเมลไปยัง hotelsystem.rmu.ac.th@gmail.com...');
    
    // สร้าง transporter
    const transporter = createTransporter();
    const emailTemplate = getTestEmailTemplate();
    
    // ส่งอีเมลทดสอบไปยังอีเมลระบบ
    try {
      await transporter.sendMail({
        from: 'hotelsystem.rmu.ac.th@gmail.com',
        to: 'hotelsystem.rmu.ac.th@gmail.com',
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      console.log('✅ ส่งอีเมลทดสอบสำเร็จไปยัง: hotelsystem.rmu.ac.th@gmail.com');
    } catch (emailError) {
      console.error('❌ ส่งอีเมลไม่สำเร็จ:', emailError.message);
      return;
    }
    
    console.log('\n📋 ทดสอบฟังก์ชันดึงรายชื่อผู้รับ...');
    
    // ทดสอบฟังก์ชัน getAdminEmails
    const [adminUsers] = await connection.execute(`
      SELECT email, first_name, last_name 
      FROM users 
      WHERE role IN ('admin', 'manager') AND email IS NOT NULL
    `);
    
    // เพิ่มอีเมลหลักของระบบ
    const systemEmail = 'hotelsystem.rmu.ac.th@gmail.com';
    const hasSystemEmail = adminUsers.some(admin => admin.email === systemEmail);
    
    if (!hasSystemEmail) {
      adminUsers.unshift({
        email: systemEmail,
        first_name: 'Hotel',
        last_name: 'System Admin'
      });
    }
    
    console.log(`📧 รายชื่อผู้รับการแจ้งเตือน (${adminUsers.length} คน):`);
    console.log('='.repeat(60));
    adminUsers.forEach((admin, index) => {
      const isSystemEmail = admin.email === systemEmail;
      console.log(`${index + 1}. ${admin.first_name} ${admin.last_name}`);
      console.log(`   📧 ${admin.email} ${isSystemEmail ? '(อีเมลระบบหลัก)' : ''}`);
      console.log('');
    });
    
    console.log('\n🎉 การตั้งค่าเสร็จสมบูรณ์!');
    console.log(`📬 ตรวจสอบอีเมล hotelsystem.rmu.ac.th@gmail.com เพื่อดูการแจ้งเตือน`);
    console.log(`🔔 ระบบจะส่งอีเมลแจ้งเตือนอัตโนมัติเมื่อมีการจอง, ชำระเงิน, หรือยกเลิก`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔚 ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
    }
  }
}

// เรียกใช้ฟังก์ชัน
testSystemEmailNotification();