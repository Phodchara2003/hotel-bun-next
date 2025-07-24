import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Gmail Connection...');
console.log('📧 Email:', process.env.GMAIL_USER);
console.log('🔐 App Password:', process.env.GMAIL_APP_PASSWORD ? '****' : 'NOT SET');

// สร้าง transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// ทดสอบการเชื่อมต่อ
async function testConnection() {
  try {
    console.log('\n🔄 Testing Gmail SMTP connection...');
    await transporter.verify();
    console.log('✅ Gmail connection successful!');
    
    // ลองส่งอีเมลทดสอบ
    console.log('\n📧 Sending test email...');
    const result = await transporter.sendMail({
      from: {
        name: 'Hotel System Test',
        address: process.env.GMAIL_USER
      },
      to: process.env.GMAIL_USER, // ส่งให้ตัวเอง
      subject: '🧪 Test Email from Hotel System',
      html: `
        <h2>Test Email Success!</h2>
        <p>ระบบส่งอีเมลทำงานได้แล้ว</p>
        <p>Sent at: ${new Date().toLocaleString('th-TH')}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', result.messageId);
    console.log('🎉 Gmail setup is working correctly!');
    
  } catch (error) {
    console.log('❌ Gmail connection failed:');
    console.log('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Solutions:');
      console.log('1. Make sure 2-Step Verification is enabled');
      console.log('2. Generate a new App Password');
      console.log('3. Double-check GMAIL_USER and GMAIL_APP_PASSWORD in .env');
    }
  }
}

testConnection();
