// เทมเพลตอีเมลสำหรับกระบวนการอนุมัติการจอง
export const BookingApprovalTemplates = {
  // เทมเพลตแจ้งผลการอนุมัติแก่ลูกค้า
  BOOKING_APPROVED: (bookingData) => ({
    subject: `✅ การจองของคุณได้รับการอนุมัติแล้ว - ${bookingData.bookingReference}`,
    html: `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>การจองได้รับการอนุมัติ</title>
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
          .approval-info {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #dcfce7;
          }
          .info-label {
            font-weight: bold;
            color: #166534;
          }
          .info-value {
            color: #15803d;
          }
          .next-steps {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .action-buttons {
            text-align: center;
            margin: 30px 0;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            text-align: center;
            background-color: #10b981;
            color: white;
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
            <h1>🎉 การจองได้รับการอนุมัติแล้ว!</h1>
            <p>ขอแสดงความยินดี การจองของคุณผ่านการตรวจสอบและอนุมัติเรียบร้อยแล้ว</p>
          </div>
          
          <div class="approval-info">
            <h3>📋 รายละเอียดการจองที่อนุมัติ</h3>
            <div class="info-row">
              <span class="info-label">รหัสการจอง:</span>
              <span class="info-value">${bookingData.bookingReference}</span>
            </div>
            ${bookingData.roomNumber ? `
            <div class="info-row">
              <span class="info-label">หมายเลขห้อง:</span>
              <span class="info-value">ห้อง ${bookingData.roomNumber}${bookingData.floor ? ` ชั้น ${bookingData.floor}` : ''}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">โรงแรม:</span>
              <span class="info-value">${bookingData.hotelName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ประเภทห้อง:</span>
              <span class="info-value">${bookingData.roomTypeName}</span>
            </div>
            ${bookingData.bedType ? `
            <div class="info-row">
              <span class="info-label">ประเภทเตียง:</span>
              <span class="info-value">${bookingData.bedType}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">วันเข้าพัก:</span>
              <span class="info-value">${new Date(bookingData.checkInDate).toLocaleDateString('th-TH')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">วันออก:</span>
              <span class="info-value">${new Date(bookingData.checkOutDate).toLocaleDateString('th-TH')}</span>
            </div>
            ${bookingData.nights ? `
            <div class="info-row">
              <span class="info-label">จำนวนคืน:</span>
              <span class="info-value">${bookingData.nights} คืน</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">จำนวนผู้เข้าพัก:</span>
              <span class="info-value">${bookingData.guests} คน${bookingData.maxGuests ? ` (สูงสุด ${bookingData.maxGuests} คน)` : ''}</span>
            </div>
            ${bookingData.pricePerNight ? `
            <div class="info-row">
              <span class="info-label">ราคาต่อคืน:</span>
              <span class="info-value">${bookingData.pricePerNight?.toLocaleString()} บาท</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">ราคารวม:</span>
              <span class="info-value" style="font-weight: bold; font-size: 18px;">${bookingData.totalPrice?.toLocaleString()} บาท</span>
            </div>
            ${bookingData.specialRequests ? `
            <div class="info-row">
              <span class="info-label">ความต้องการพิเศษ:</span>
              <span class="info-value">${bookingData.specialRequests}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">สถานะ:</span>
              <span class="info-value" style="color: #10b981; font-weight: bold;">อนุมัติแล้ว ✅</span>
            </div>
          </div>
          
          <div class="next-steps">
            <h3>📌 ขั้นตอนต่อไป</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>โรงแรมจะติดต่อกลับภายใน 24 ชั่วโมง เพื่อยืนยันรายละเอียด</li>
              <li>กรุณาเตรียมเอกสารประจำตัวสำหรับการเช็คอิน</li>
              <li>หากต้องการเปลี่ยนแปลงข้อมูล กรุณาติดต่อโรงแรมโดยตรง</li>
              <li>คุณจะได้รับอีเมลแจ้งเตือนก่อนวันเข้าพัก 1 วัน</li>
            </ul>
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${bookingData.bookingId}" class="btn">
              ดูรายละเอียดการจอง
            </a>
          </div>
          
          <div style="background: #fef7cd; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">
              💡 <strong>หมายเหตุ:</strong> หากมีคำถามหรือต้องการความช่วยเหลือ สามารถติดต่อเราได้ที่ support@hotelbooking.com
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Hotel Booking System</strong></p>
            <p style="color: #666; font-size: 12px;">
              © 2025 Hotel Booking System. สงวนลิขสิทธิ์.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // เทมเพลตแจ้งการปฏิเสธการจองแก่ลูกค้า
  BOOKING_REJECTED: (bookingData, reason) => ({
    subject: `❌ การจองของคุณไม่ได้รับการอนุมัติ - ${bookingData.bookingReference}`,
    html: `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>การจองไม่ได้รับการอนุมัติ</title>
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
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .rejection-info {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #fecaca;
          }
          .info-label {
            font-weight: bold;
            color: #991b1b;
          }
          .info-value {
            color: #dc2626;
          }
          .alternative-options {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .action-buttons {
            text-align: center;
            margin: 30px 0;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            text-align: center;
          }
          .btn-primary {
            background-color: #3b82f6;
            color: white;
          }
          .btn-secondary {
            background-color: #6b7280;
            color: white;
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
            <h1>😔 การจองไม่ได้รับการอนุมัติ</h1>
            <p>เราขออภัยที่การจองของคุณไม่สามารถดำเนินการต่อได้</p>
          </div>
          
          <div class="rejection-info">
            <h3>📋 รายละเอียดการจองที่ไม่ได้รับการอนุมัติ</h3>
            <div class="info-row">
              <span class="info-label">รหัสการจอง:</span>
              <span class="info-value">${bookingData.bookingReference}</span>
            </div>
            ${bookingData.roomNumber ? `
            <div class="info-row">
              <span class="info-label">หมายเลขห้อง:</span>
              <span class="info-value">ห้อง ${bookingData.roomNumber}${bookingData.floor ? ` ชั้น ${bookingData.floor}` : ''}</span>
            </div>
            ` : ''}
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
              <span class="info-label">เหตุผลที่ไม่อนุมัติ:</span>
              <span class="info-value">${reason || 'ไม่ได้ระบุเหตุผล'}</span>
            </div>
          </div>
          
          <div class="alternative-options">
            <h3>💡 ทางเลือกอื่น</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>ลองเปลี่ยนวันที่เข้าพักเป็นช่วงเวลาอื่น</li>
              <li>เลือกโรงแรมหรือประเภทห้องอื่น</li>
              <li>ติดต่อทีมงานเพื่อขอคำแนะนำ</li>
              <li>ลองจองใหม่ตามคำแนะนำที่แจ้งไว้</li>
            </ul>
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/search" class="btn btn-primary">
              ค้นหาใหม่
            </a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" class="btn btn-secondary">
              ติดต่อเรา
            </a>
          </div>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-weight: bold;">
              💚 <strong>ขอบคุณสำหรับความไว้วางใจ</strong> เราหวังว่าจะได้ให้บริการคุณในโอกาสต่อไป
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Hotel Booking System</strong></p>
            <p style="color: #666; font-size: 12px;">
              © 2025 Hotel Booking System. สงวนลิขสิทธิ์.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // เทมเพลตขอข้อมูลเพิ่มเติมจากลูกค้า
  REQUEST_ADDITIONAL_INFO: (bookingData, requestedInfo) => ({
    subject: `📝 กรุณาให้ข้อมูลเพิ่มเติมสำหรับการจอง - ${bookingData.bookingReference}`,
    html: `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ขอข้อมูลเพิ่มเติม</title>
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
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .request-info {
            background: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
          }
          .required-fields {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
          }
          .action-buttons {
            text-align: center;
            margin: 30px 0;
          }
          .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            text-align: center;
            background-color: #f59e0b;
            color: white;
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
            <h1>📝 ต้องการข้อมูลเพิ่มเติม</h1>
            <p>เพื่อความสมบูรณ์ในการจองของคุณ</p>
          </div>
          
          <div class="request-info">
            <h3>📋 การจองของคุณ</h3>
            <p><strong>รหัสการจอง:</strong> ${bookingData.bookingReference}</p>
            ${bookingData.roomNumber ? `<p><strong>หมายเลขห้อง:</strong> ห้อง ${bookingData.roomNumber}${bookingData.floor ? ` ชั้น ${bookingData.floor}` : ''}</p>` : ''}
            <p><strong>โรงแรม:</strong> ${bookingData.hotelName}</p>
            <p><strong>วันเข้าพัก:</strong> ${new Date(bookingData.checkInDate).toLocaleDateString('th-TH')}</p>
          </div>
          
          <div class="required-fields">
            <h3>📌 ข้อมูลที่ต้องการเพิ่มเติม</h3>
            <ul>
              ${requestedInfo.map(info => `<li>${info}</li>`).join('')}
            </ul>
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/bookings/${bookingData.bookingId}/edit" class="btn">
              เพิ่มข้อมูล
            </a>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #dc2626; font-weight: bold;">
              ⏰ <strong>สำคัญ:</strong> กรุณาให้ข้อมูลภายใน 48 ชั่วโมง เพื่อไม่ให้การจองหมดอายุ
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Hotel Booking System</strong></p>
            <p style="color: #666; font-size: 12px;">
              © 2025 Hotel Booking System. สงวนลิขสิทธิ์.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};