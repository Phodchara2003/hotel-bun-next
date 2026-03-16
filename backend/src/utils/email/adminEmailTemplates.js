// เทมเพลตอีเมลสำหรับการแจ้งเตือนแอดมิน
export const AdminEmailTemplates = {
  // เทมเพลตแจ้งเตือนการจองใหม่
  NEW_BOOKING_NOTIFICATION: (bookingData) => ({
    subject: `🆕 มีการจองใหม่ - ${bookingData.bookingReference}`,
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
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
            transition: all 0.3s ease;
          }
          .btn-approve {
            background-color: #10b981;
            color: white;
          }
          .btn-approve:hover {
            background-color: #059669;
          }
          .btn-view {
            background-color: #3b82f6;
            color: white;
          }
          .btn-view:hover {
            background-color: #2563eb;
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
              <span class="info-label">เบอร์โทรลูกค้า:</span>
              <span class="info-value">${bookingData.customerPhone || 'ไม่ได้ระบุ'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">โรงแรม:</span>
              <span class="info-value">${bookingData.hotelName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ประเภทห้อง:</span>
              <span class="info-value">${bookingData.roomTypeName}</span>
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
              <span class="info-label">จำนวนผู้เข้าพัก:</span>
              <span class="info-value">${bookingData.guests} คน</span>
            </div>
            <div class="info-row">
              <span class="info-label">ราคารวม:</span>
              <span class="info-value" style="font-weight: bold; color: #10b981;">${bookingData.totalPrice?.toLocaleString()} บาท</span>
            </div>
            <div class="info-row">
              <span class="info-label">สถานะ:</span>
              <span class="info-value" style="color: #f59e0b; font-weight: bold;">รอการอนุมัติ</span>
            </div>
            ${bookingData.specialRequests ? `
            <div class="info-row">
              <span class="info-label">ความต้องการพิเศษ:</span>
              <span class="info-value">${bookingData.specialRequests}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/bookings/${bookingData.bookingId}" class="btn btn-view">
              👀 ดูรายละเอียด
            </a>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/dashboard" class="btn btn-approve">
              ✅ ไปที่หน้าแอดมิน
            </a>
          </div>
          
          <div style="background: #fef7cd; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">
              💡 <strong>คำแนะนำ:</strong> กรุณาตรวจสอบข้อมูลการจองและดำเนินการอนุมัติหรือปฏิเสธภายใน 24 ชั่วโมง
            </p>
          </div>
          
          <div class="footer">
            <p><strong>Hotel Booking Admin System</strong></p>
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
  }),

  // เทมเพลตแจ้งเตือนการชำระเงิน
  PAYMENT_RECEIVED_NOTIFICATION: (bookingData) => ({
    subject: `💰 ได้รับการชำระเงิน - ${bookingData.bookingReference}`,
    html: `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>การชำระเงิน</title>
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
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }
          .payment-info {
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
            <h1>💰 ได้รับการชำระเงินแล้ว</h1>
            <p>ลูกค้าได้ทำการชำระเงินสำหรับการจองแล้ว</p>
          </div>
          
          <div class="payment-info">
            <h3>💳 รายละเอียดการชำระเงิน</h3>
            <div class="info-row">
              <span class="info-label">รหัสการจอง:</span>
              <span class="info-value">${bookingData.bookingReference}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ชื่อลูกค้า:</span>
              <span class="info-value">${bookingData.customerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">จำนวนเงิน:</span>
              <span class="info-value" style="font-weight: bold; font-size: 18px;">${bookingData.totalPrice?.toLocaleString()} บาท</span>
            </div>
            <div class="info-row">
              <span class="info-label">วันที่ชำระ:</span>
              <span class="info-value">${new Date().toLocaleDateString('th-TH')}</span>
            </div>
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/bookings/${bookingData.bookingId}" class="btn">
              ตรวจสอบการชำระเงิน
            </a>
          </div>
          
          <div class="footer">
            <p><strong>Hotel Booking Admin System</strong></p>
            <p style="color: #666; font-size: 12px;">
              © 2025 Hotel Booking System. สงวนลิขสิทธิ์.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  // เทมเพลตแจ้งเตือนการยกเลิก
  CANCELLATION_NOTIFICATION: (bookingData) => ({
    subject: `❌ การจองถูกยกเลิก - ${bookingData.bookingReference}`,
    html: `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>การยกเลิกการจอง</title>
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
          .cancel-info {
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
            <h1>❌ การจองถูกยกเลิกแล้ว</h1>
            <p>ลูกค้าได้ทำการยกเลิกการจอง</p>
          </div>
          
          <div class="cancel-info">
            <h3>📋 รายละเอียดการยกเลิก</h3>
            <div class="info-row">
              <span class="info-label">รหัสการจอง:</span>
              <span class="info-value">${bookingData.bookingReference}</span>
            </div>
            <div class="info-row">
              <span class="info-label">ชื่อลูกค้า:</span>
              <span class="info-value">${bookingData.customerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">มูลค่าการจอง:</span>
              <span class="info-value">${bookingData.totalPrice?.toLocaleString()} บาท</span>
            </div>
            <div class="info-row">
              <span class="info-label">วันที่ยกเลิก:</span>
              <span class="info-value">${new Date().toLocaleDateString('th-TH')}</span>
            </div>
            ${bookingData.reason ? `
            <div class="info-row">
              <span class="info-label">เหตุผลการยกเลิก:</span>
              <span class="info-value">${bookingData.reason}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p><strong>Hotel Booking Admin System</strong></p>
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