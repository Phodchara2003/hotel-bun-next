/**
 * ทดสอบระบบแจ้งเตือนอีเมลแอดมินด้วยข้อมูลการจองจริง
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

// เทมเพลตอีเมลแจ้งเตือนการจองใหม่ (แบบย่อ)
const getNewBookingEmailTemplate = (bookingData) => {
  return {
    subject: `🆕 มีการจองใหม่ - ${bookingData.booking_reference}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">🏨 การจองใหม่!</h1>
          <p style="margin: 10px 0 0 0;">ระบบจองโรงแรมวรุณภัฏ</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1e40af; margin: 0 0 20px 0;">📋 รายละเอียดการจอง</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">รหัสการจอง:</td>
              <td style="padding: 10px 0;">${bookingData.booking_reference}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">ชื่อลูกค้า:</td>
              <td style="padding: 10px 0;">${bookingData.guest_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">อีเมล:</td>
              <td style="padding: 10px 0;">${bookingData.guest_email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">เบอร์โทร:</td>
              <td style="padding: 10px 0;">${bookingData.guest_phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">ประเภทห้อง:</td>
              <td style="padding: 10px 0;">${bookingData.room_type}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">วันเช็คอิน:</td>
              <td style="padding: 10px 0;">${bookingData.check_in}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">วันเช็คเอาท์:</td>
              <td style="padding: 10px 0;">${bookingData.check_out}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold;">จำนวนผู้เข้าพัก:</td>
              <td style="padding: 10px 0;">${bookingData.guests} คน</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: bold;">ราคารวม:</td>
              <td style="padding: 10px 0; color: #059669; font-weight: bold;">฿${Number(bookingData.total_amount).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; padding: 20px; background-color: #f9fafb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            🧪 นี่คือการทดสอบระบบแจ้งเตือนอีเมล<br>
            ส่งเมื่อ: ${bookingData.created_at}
          </p>
        </div>
      </div>
    `
  };
};

async function testBookingEmailNotification() {
  let connection = null;
  
  try {
    console.log('🔍 เชื่อมต่อกับฐานข้อมูล...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📊 ดึงข้อมูลการจองล่าสุด...');
    
    // ดึงการจองล่าสุด
    const [bookings] = await connection.execute(`
      SELECT 
        b.*,
        h.name as hotel_name,
        rt.name as room_type_name
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      ORDER BY b.created_at DESC
      LIMIT 1
    `);
    
    if (bookings.length === 0) {
      console.log('❌ ไม่พบข้อมูลการจองในระบบ');
      return;
    }
    
    const booking = bookings[0];
    console.log(`📋 พบการจอง ID: ${booking.id} - ${booking.booking_reference}`);
    
    // ดึงรายชื่อแอดมิน
    const [admins] = await connection.execute(`
      SELECT email, first_name, last_name 
      FROM users 
      WHERE role IN ('admin', 'manager') AND email IS NOT NULL
    `);
    
    console.log(`📧 พบแอดมิน ${admins.length} คน`);
    
    if (admins.length === 0) {
      console.log('❌ ไม่พบผู้ใช้แอดมินที่สามารถรับอีเมลได้');
      return;
    }
    
    // เตรียมข้อมูลสำหรับอีเมล
    const bookingData = {
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      guest_phone: booking.guest_phone,
      hotel_name: booking.hotel_name || 'โรงแรมวรุณภัฏ',
      room_type: booking.room_type_name || 'ห้องพักมาตรฐาน',
      check_in: booking.check_in_date,
      check_out: booking.check_out_date,
      guests: booking.guests,
      total_amount: booking.total_price,
      created_at: new Date().toLocaleString('th-TH')
    };
    
    console.log('📧 เริ่มส่งอีเมลทดสอบ...');
    
    // สร้าง transporter
    const transporter = createTransporter();
    const emailTemplate = getNewBookingEmailTemplate(bookingData);
    
    // ส่งอีเมลให้แอดมินทุกคน
    let successCount = 0;
    let failCount = 0;
    
    for (const admin of admins) {
      try {
        await transporter.sendMail({
          from: 'hotelsystem.rmu.ac.th@gmail.com',
          to: admin.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        });
        console.log(`✅ ส่งอีเมลแจ้งเตือนสำเร็จไปยัง: ${admin.email}`);
        successCount++;
      } catch (emailError) {
        console.error(`❌ ส่งอีเมลไม่สำเร็จไปยัง ${admin.email}:`, emailError.message);
        failCount++;
      }
    }
    
    console.log('\n📊 สรุปผลการทดสอบ:');
    console.log(`✅ ส่งสำเร็จ: ${successCount} ฉบับ`);
    console.log(`❌ ส่งไม่สำเร็จ: ${failCount} ฉบับ`);
    
    if (successCount > 0) {
      console.log('\n🎉 ระบบแจ้งเตือนอีเมลแอดมินทำงานได้ปกติ!');
      console.log('📬 ตรวจสอบอีเมลแอดมินเพื่อดูการแจ้งเตือน');
    } else {
      console.log('\n⚠️ ระบบแจ้งเตือนอีเมลยังไม่ทำงาน');
      console.log('🔧 ตรวจสอบการตั้งค่าอีเมลและรหัสผ่าน');
    }
    
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
testBookingEmailNotification();