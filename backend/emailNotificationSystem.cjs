// Integration สำหรับเพิ่มระบบการแจ้งเตือนอีเมลเข้าไปใน mysql-server.cjs
const nodemailer = require('nodemailer');
const cron = require('node-cron');

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// เทมเพลตอีเมลสำหรับการจองสำเร็จ
const generateBookingConfirmationEmail = (bookingData, userName, status = 'pending') => {
  const statusConfig = {
    'pending': {
      text: 'รอการอนุมัติ',
      color: '#f59e0b',
      message: '💡 <strong>หมายเหตุ:</strong> การจองของท่านรอการตรวจสอบและอนุมัติจากทางโรงแรม ซึ่งจะได้รับการแจ้งผลภายใน 24 ชั่วโมง'
    },
    'confirmed': {
      text: 'อนุมัติแล้ว',
      color: '#10b981',
      message: '🎉 <strong>ยินดีด้วย!</strong> การจองของท่านได้รับการอนุมัติแล้ว พร้อมต้อนรับท่านในวันที่เข้าพัก'
    }
  };

  const currentStatus = statusConfig[status] || statusConfig['pending'];

  return {
    subject: status === 'confirmed' 
      ? `✅ การจองได้รับการอนุมัติ - ${bookingData.bookingReference}`
      : `✅ ยืนยันการจองสำเร็จ - ${bookingData.bookingReference}`,
    html: `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ยืนยันการจอง</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
            margin: 20px 0;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .booking-info {
            background: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-label {
            font-weight: bold;
            color: #4a5568;
          }
          .info-value {
            color: #2d3748;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${status === 'confirmed' ? '🎉 การจองได้รับการอนุมัติ!' : '🎉 การจองสำเร็จ!'}</h1>
            <p>ขอบคุณที่เลือกใช้บริการของเรา</p>
          </div>
          
          <div style="padding: 20px 0;">
            <p>เรียน คุณ${userName}</p>
            <p>${status === 'confirmed' ? 'ยินดีด้วย! การจองของท่านได้รับการอนุมัติเรียบร้อยแล้ว' : 'ยินดีต้อนรับ! การจองของท่านได้รับการยืนยันเรียบร้อยแล้ว'}</p>
          </div>
          
          <div class="booking-info">
            <h3>📋 รายละเอียดการจอง</h3>
            <div class="info-row">
              <span class="info-label">รหัสการจอง:</span>
              <span class="info-value">${bookingData.bookingReference}</span>
            </div>
            <div class="info-row">
              <span class="info-label">โรงแรม:</span>
              <span class="info-value">${bookingData.hotelName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ประเภทห้อง:</span>
              <span class="info-value">${bookingData.roomTypeName || bookingData.roomType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">วันเข้าพัก:</span>
              <span class="info-value">${typeof bookingData.checkInDate === 'string' ? bookingData.checkInDate : new Date(bookingData.checkInDate).toLocaleDateString('th-TH')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">วันออก:</span>
              <span class="info-value">${typeof bookingData.checkOutDate === 'string' ? bookingData.checkOutDate : new Date(bookingData.checkOutDate).toLocaleDateString('th-TH')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">จำนวนผู้เข้าพัก:</span>
              <span class="info-value">${bookingData.guests} คน</span>
            </div>
            <div class="info-row">
              <span class="info-label">ราคารวม:</span>
              <span class="info-value" style="font-weight: bold; color: #10b981;">${bookingData.totalPrice?.toLocaleString()} บาท</span>
            </div>
            <div class="info-row">
              <span class="info-label">สถานะ:</span>
              <span class="info-value" style="color: ${currentStatus.color}; font-weight: bold;">${currentStatus.text}</span>
            </div>
          </div>
          
          <div style="background: ${status === 'confirmed' ? '#dcfce7' : '#fef7cd'}; border: 1px solid ${status === 'confirmed' ? '#16a34a' : '#fbbf24'}; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: ${status === 'confirmed' ? '#15803d' : '#92400e'}; font-weight: bold;">
              ${currentStatus.message}
            </p>
          </div>
          
          <div class="footer">
            <p><strong>ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม</strong></p>
            <p style="color: #666; font-size: 12px;">
              © 2025 พัฒนาโดย นาย พชร มีหา - มหาวิทยาลัยราชภัฏมหาสารคาม
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// เทมเพลตอีเมลสำหรับแอดมิน
const generateAdminNotificationEmail = (bookingData) => {
  return {
    subject: `🆕 มีการจองใหม่ต้องการการอนุมัติ - ${bookingData.bookingReference}`,
    html: `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>การจองใหม่</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
            margin: 20px 0;
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .urgent {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 10px;
            border-radius: 6px;
            margin: 15px 0;
            text-align: center;
            font-weight: bold;
          }
          .booking-info {
            background: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-label {
            font-weight: bold;
            color: #4a5568;
          }
          .info-value {
            color: #2d3748;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🆕 การจองใหม่ต้องการการอนุมัติ</h1>
            <p>มีการจองใหม่เข้ามาในระบบแล้ว กรุณาตรวจสอบและอนุมัติ</p>
          </div>
          
          <div class="urgent">
            ⚠️ การจองนี้รอการอนุมัติจากแอดมิน กรุณาดำเนินการโดยเร็วที่สุด
          </div>
          
          <div class="booking-info">
            <h3>📋 รายละเอียดการจอง</h3>
            <div class="info-row">
              <span class="info-label">รหัสการจอง:</span>
              <span class="info-value">${bookingData.bookingReference}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ชื่อลูกค้า:</span>
              <span class="info-value">${bookingData.customerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">อีเมลลูกค้า:</span>
              <span class="info-value">${bookingData.customerEmail}</span>
            </div>
            <div class="info-row">
              <span class="info-label">โรงแรม:</span>
              <span class="info-value">${bookingData.hotelName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">วันเข้าพัก:</span>
              <span class="info-value">${new Date(bookingData.checkInDate).toLocaleDateString('th-TH')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">วันออก:</span>
              <span class="info-value">${new Date(bookingData.checkOutDate).toLocaleDateString('th-TH')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ราคารวม:</span>
              <span class="info-value" style="font-weight: bold; color: #10b981;">${bookingData.totalPrice?.toLocaleString()} บาท</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/admin/dashboard" style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #10b981;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            ">ไปที่หน้าแอดมิน</a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p><strong>ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม</strong></p>
            <p style="color: #666; font-size: 12px;">
              วันที่: ${new Date().toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// ฟังก์ชันส่งอีเมลยืนยันการจอง
const sendBookingConfirmationEmail = async (email, bookingData, userName, status = 'pending') => {
  try {
    const transporter = createTransporter();
    const template = generateBookingConfirmationEmail(bookingData, userName, status);
    
    const mailOptions = {
      from: {
        name: 'ระบบจองโรงแรมวรุณภัฏ',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Booking confirmation email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// ฟังก์ชันส่งอีเมลแจ้งเตือนแอดมิน
const sendAdminNotificationEmail = async (bookingData) => {
  try {
    // ดึงรายชื่ออีเมลแอดมินจากฐานข้อมูล (ต้องส่ง db connection เข้ามา)
    const adminEmails = [
      process.env.ADMIN_EMAIL_1 || 'admin@hotel.com',
      process.env.ADMIN_EMAIL_2 || 'manager@hotel.com'
    ].filter(email => email && email !== 'admin@hotel.com'); // กรอง default email ออก

    if (adminEmails.length === 0) {
      console.log('⚠️ No admin emails configured');
      return { success: false, error: 'No admin emails configured' };
    }

    const transporter = createTransporter();
    const template = generateAdminNotificationEmail(bookingData);
    
    // ส่งอีเมลให้แอดมินทุกคน
    const results = [];
    for (const adminEmail of adminEmails) {
      try {
        const mailOptions = {
          from: {
            name: 'ระบบจองโรงแรมวรุณภัฏ - Admin Alert',
            address: process.env.GMAIL_USER
          },
          to: adminEmail,
          subject: template.subject,
          html: template.html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Admin notification email sent to ${adminEmail}:`, result.messageId);
        results.push({ email: adminEmail, success: true, messageId: result.messageId });
      } catch (emailError) {
        console.error(`❌ Failed to send admin email to ${adminEmail}:`, emailError);
        results.push({ email: adminEmail, success: false, error: emailError.message });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('❌ Error sending admin notification emails:', error);
    return { success: false, error: error.message };
  }
};

// ฟังก์ชันส่งอีเมลแจ้งเตือนก่อนเข้าพัก
const sendCheckInReminderEmail = async (email, bookingData, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'ระบบจองโรงแรมวรุณภัฏ',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: `🏨 แจ้งเตือนการเข้าพัก - ${bookingData.bookingReference}`,
      html: `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>แจ้งเตือนการเข้าพัก</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8fafc;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              padding: 30px;
              margin: 20px 0;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 25px;
              border-radius: 8px;
              text-align: center;
              margin-bottom: 30px;
            }
            .reminder-info {
              background: #f0fdf4;
              border-left: 4px solid #10b981;
              padding: 20px;
              margin: 20px 0;
              border-radius: 0 8px 8px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 พรุ่งนี้คือวันเข้าพักของคุณ!</h1>
              <p>เตรียมตัวสำหรับการพักผ่อนที่ยอดเยี่ยม</p>
            </div>
            
            <div style="padding: 20px 0;">
              <p>เรียน คุณ${userName}</p>
              <p>ขอแจ้งให้ทราบว่าพรุ่งนี้ (${new Date(bookingData.checkInDate).toLocaleDateString('th-TH')}) เป็นวันเข้าพักตามการจองของท่าน</p>
            </div>
            
            <div class="reminder-info">
              <h3>📋 รายละเอียดการเข้าพัก</h3>
              <p><strong>รหัสการจอง:</strong> ${bookingData.bookingReference}</p>
              <p><strong>โรงแรม:</strong> ${bookingData.hotelName}</p>
              <p><strong>วันเข้าพัก:</strong> ${new Date(bookingData.checkInDate).toLocaleDateString('th-TH')}</p>
              <p><strong>วันออก:</strong> ${new Date(bookingData.checkOutDate).toLocaleDateString('th-TH')}</p>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h4>📌 สิ่งที่ควรเตรียม:</h4>
              <ul>
                <li>บัตรประจำตัวประชาชนหรือหนังสือเดินทาง</li>
                <li>เอกสารยืนยันการจอง</li>
                <li>เวลาเช็คอิน: 14:00 น.</li>
                <li>หากต้องการเช็คอินก่อนเวลา กรุณาติดต่อโรงแรมล่วงหน้า</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p><strong>ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม</strong></p>
              <p style="color: #666; font-size: 12px;">
                © 2025 พัฒนาโดย นาย พชร มีหา - มหาวิทยาลัยราชภัฏมหาสารคาม
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Check-in reminder email sent to ${email}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending check-in reminder email:', error);
    return { success: false, error: error.message };
  }
};

// ระบบ Cron Jobs สำหรับการแจ้งเตือนอัตโนมัติ
const initializeEmailNotificationSystem = (dbConnection) => {
  // แจ้งเตือนก่อนเข้าพัก (ทำงานทุกวันเวลา 09:00)
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Running check-in reminder job...');
    
    try {
      // หาการจองที่จะเข้าพักพรุ่งนี้
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const [upcomingBookings] = await dbConnection.execute(`
        SELECT 
          b.id,
          b.booking_reference,
          b.check_in_date,
          b.check_out_date,
          b.total_price,
          u.email,
          u.first_name,
          u.last_name,
          h.name as hotel_name,
          rt.name as room_type_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        LEFT JOIN hotels h ON rt.hotel_id = h.id
        WHERE DATE(b.check_in_date) = ? 
        AND b.status IN ('confirmed', 'approved')
      `, [tomorrowStr]);

      console.log(`📋 Found ${upcomingBookings.length} bookings for tomorrow check-in reminders`);

      // ส่งอีเมลแจ้งเตือนแต่ละการจอง
      for (const booking of upcomingBookings) {
        try {
          const bookingData = {
            bookingReference: booking.booking_reference,
            hotelName: booking.hotel_name,
            roomTypeName: booking.room_type_name,
            checkInDate: booking.check_in_date,
            checkOutDate: booking.check_out_date,
            totalPrice: booking.total_price
          };

          const userName = `${booking.first_name || ''} ${booking.last_name || ''}`.trim() || 'ลูกค้า';

          await sendCheckInReminderEmail(booking.email, bookingData, userName);
          console.log(`✅ Check-in reminder sent for booking ${booking.booking_reference}`);
        } catch (emailError) {
          console.error(`❌ Failed to send check-in reminder for booking ${booking.id}:`, emailError);
        }
      }

      console.log('✅ Check-in reminder job completed');
    } catch (error) {
      console.error('❌ Error in check-in reminder job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });

  // ส่งสรุปประจำวันให้แอดมิน (ทำงานทุกวันเวลา 18:00)
  cron.schedule('0 18 * * *', async () => {
    console.log('📊 Running daily summary job...');
    
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // ดึงข้อมูลสถิติประจำวัน
      const [todayStats] = await dbConnection.execute(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_bookings,
          COALESCE(SUM(CASE WHEN status = 'approved' THEN total_price END), 0) as total_revenue
        FROM bookings 
        WHERE DATE(created_at) = ?
      `, [todayStr]);

      const stats = todayStats[0];

      // สร้างอีเมลสรุปประจำวัน
      const adminEmails = [
        process.env.ADMIN_EMAIL_1 || 'admin@hotel.com',
        process.env.ADMIN_EMAIL_2 || 'manager@hotel.com'
      ].filter(email => email && email !== 'admin@hotel.com');

      if (adminEmails.length > 0) {
        const transporter = createTransporter();
        
        for (const adminEmail of adminEmails) {
          try {
            const mailOptions = {
              from: {
                name: 'ระบบจองโรงแรมวรุณภัฏ - Daily Report',
                address: process.env.GMAIL_USER
              },
              to: adminEmail,
              subject: `📊 สรุปกิจกรรมประจำวัน - ${today.toLocaleDateString('th-TH')}`,
              html: `
                <!DOCTYPE html>
                <html lang="th">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>สรุปกิจกรรมประจำวัน</title>
                  <style>
                    body {
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      line-height: 1.6;
                      color: #333;
                      max-width: 600px;
                      margin: 0 auto;
                      padding: 20px;
                      background-color: #f8fafc;
                    }
                    .container {
                      background: white;
                      border-radius: 12px;
                      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                      padding: 30px;
                      margin: 20px 0;
                    }
                    .header {
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 20px;
                      border-radius: 8px;
                      text-align: center;
                      margin-bottom: 30px;
                    }
                    .stat-card {
                      background: #f8f9ff;
                      border: 1px solid #e2e8f0;
                      border-radius: 8px;
                      padding: 20px;
                      margin: 15px 0;
                      text-align: center;
                    }
                    .metric {
                      font-size: 2em;
                      font-weight: bold;
                      color: #4c51bf;
                      margin-bottom: 5px;
                    }
                    .metric-label {
                      color: #718096;
                      font-size: 0.9em;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>📊 สรุปกิจกรรมประจำวัน</h1>
                      <p>วันที่ ${today.toLocaleDateString('th-TH', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}</p>
                    </div>
                    
                    <div class="stat-card">
                      <div class="metric">${stats.total_bookings}</div>
                      <div class="metric-label">การจองทั้งหมด</div>
                    </div>
                    
                    <div class="stat-card">
                      <div class="metric">${stats.pending_bookings}</div>
                      <div class="metric-label">รอการอนุมัติ</div>
                    </div>
                    
                    <div class="stat-card">
                      <div class="metric">${stats.confirmed_bookings}</div>
                      <div class="metric-label">ยืนยันแล้ว</div>
                    </div>
                    
                    <div class="stat-card">
                      <div class="metric">${stats.approved_bookings}</div>
                      <div class="metric-label">อนุมัติแล้ว</div>
                    </div>
                    
                    <div class="stat-card">
                      <div class="metric">${Number(stats.total_revenue).toLocaleString()} ฿</div>
                      <div class="metric-label">รายได้รวม</div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                      <p><strong>ระบบจองโรงแรมวรุณภัฏมหาวิทยาลัยราชภัฏมหาสารคาม</strong></p>
                      <p style="color: #666; font-size: 12px;">
                        © 2025 พัฒนาโดย นาย พชร มีหา - มหาวิทยาลัยราชภัฏมหาสารคาม
                      </p>
                    </div>
                  </div>
                </body>
                </html>
              `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Daily summary email sent to admin: ${adminEmail}`);
          } catch (emailError) {
            console.error(`❌ Failed to send daily summary to ${adminEmail}:`, emailError);
          }
        }
      }

      console.log('✅ Daily summary job completed');
    } catch (error) {
      console.error('❌ Error in daily summary job:', error);
    }
  }, {
    timezone: 'Asia/Bangkok'
  });

  // Remove verbose logging
  // console.log('✅ Email notification system initialized');
  // console.log(`🕐 Scheduled jobs: ...`);
};

// ฟังก์ชันส่งอีเมลรีเซ็ตรหัสผ่าน
const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    console.log(`📧 Preparing password reset email for: ${email}`);
    
    const transporter = createTransporter();
    
    // ทดสอบการเชื่อมต่อ
    await transporter.verify();
    console.log('✅ Email transporter verified');
    
    const mailOptions = {
      from: {
        name: 'โรงแรมวรุณภัฏ - ระบบจองห้องพัก',
        address: process.env.GMAIL_USER
      },
      to: email,
      subject: '🔐 รีเซ็ตรหัสผ่าน - โรงแรมวรุณภัฏ',
      html: `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>รีเซ็ตรหัสผ่าน</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #059669, #0891b2);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #059669, #0891b2);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background: #fef3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 โรงแรมวรุณภัฏ</h1>
              <p>ระบบจองห้องพัก มหาวิทยาลัยราชภัฏมหาสารคาม</p>
            </div>
            
            <div class="content">
              <h2>🔐 รีเซ็ตรหัสผ่าน</h2>
              
              <p>สวัสดีค่ะ,</p>
              
              <p>เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี <strong>${email}</strong></p>
              
              <p>กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">🔑 รีเซ็ตรหัสผ่าน</a>
              </div>
              
              <div class="warning">
                ⚠️ <strong>ข้อมูลสำคัญ:</strong><br>
                • ลิงก์นี้จะหมดอายุใน <strong>15 นาที</strong><br>
                • หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้<br>
                • ไม่แชร์ลิงก์นี้กับผู้อื่น
              </div>
              
              <p>หากปุ่มไม่ทำงาน กรุณาคัดลอกและวางลิงก์นี้ในเบราว์เซอร์:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 14px;">
                ${resetUrl}
              </p>
              
              <p>หากมีคำถาม กรุณาติดต่อทีมสนับสนุน</p>
              
              <p>ขอแสดงความนับถือ,<br>
              ทีมงานโรงแรมวรุณภัฏ</p>
            </div>
            
            <div class="footer">
              <p>📧 ${process.env.GMAIL_USER} | 📞 ติดต่อสนับสนุน</p>
              <p>© 2025 โรงแรมวรุณภัฏ มหาวิทยาลัยราชภัฏมหาสารคาม</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log('📤 Sending password reset email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Password reset email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  sendAdminNotificationEmail,
  sendCheckInReminderEmail,
  sendPasswordResetEmail,
  initializeEmailNotificationSystem
};