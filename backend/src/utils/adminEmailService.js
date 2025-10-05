import nodemailer from 'nodemailer';
import { AdminEmailTemplates } from './adminEmailTemplates.js';

// กำหนดค่า SMTP สำหรับ Gmail
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

// ส่งอีเมลแจ้งเตือนการจองใหม่แก่แอดมิน
export const sendNewBookingAdminEmail = async (adminEmail, bookingData) => {
  try {
    const transporter = createTransporter();
    const template = AdminEmailTemplates.NEW_BOOKING_NOTIFICATION(bookingData);
    
    const mailOptions = {
      from: {
        name: 'Hotel Booking System - Admin Notifications',
        address: process.env.GMAIL_USER
      },
      to: adminEmail,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Admin notification email sent to ${adminEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending admin notification email:', error);
    throw error;
  }
};

// ส่งอีเมลแจ้งเตือนการชำระเงินแก่แอดมิน
export const sendPaymentReceivedAdminEmail = async (adminEmail, bookingData) => {
  try {
    const transporter = createTransporter();
    const template = AdminEmailTemplates.PAYMENT_RECEIVED_NOTIFICATION(bookingData);
    
    const mailOptions = {
      from: {
        name: 'Hotel Booking System - Admin Notifications',
        address: process.env.GMAIL_USER
      },
      to: adminEmail,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Payment notification email sent to ${adminEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending payment notification email:', error);
    throw error;
  }
};

// ส่งอีเมลแจ้งเตือนการยกเลิกแก่แอดมิน
export const sendCancellationAdminEmail = async (adminEmail, bookingData) => {
  try {
    const transporter = createTransporter();
    const template = AdminEmailTemplates.CANCELLATION_NOTIFICATION(bookingData);
    
    const mailOptions = {
      from: {
        name: 'Hotel Booking System - Admin Notifications',
        address: process.env.GMAIL_USER
      },
      to: adminEmail,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Cancellation notification email sent to ${adminEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending cancellation notification email:', error);
    throw error;
  }
};

// ส่งอีเมลแจ้งเตือนรายวันสำหรับแอดมิน (สรุปกิจกรรม)
export const sendDailyAdminSummaryEmail = async (adminEmail, summaryData) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Hotel Booking System - Daily Summary',
        address: process.env.GMAIL_USER
      },
      to: adminEmail,
      subject: `📊 สรุปกิจกรรมประจำวัน - ${new Date().toLocaleDateString('th-TH')}`,
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
            .summary-card {
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
              <h1>📊 สรุปกิจกรรมประจำวัน</h1>
              <p>วันที่ ${new Date().toLocaleDateString('th-TH', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}</p>
            </div>
            
            <div class="summary-card">
              <div class="metric">${summaryData.newBookings || 0}</div>
              <div class="metric-label">การจองใหม่</div>
            </div>
            
            <div class="summary-card">
              <div class="metric">${summaryData.completedBookings || 0}</div>
              <div class="metric-label">การจองที่เสร็จสิ้น</div>
            </div>
            
            <div class="summary-card">
              <div class="metric">${summaryData.pendingApprovals || 0}</div>
              <div class="metric-label">รอการอนุมัติ</div>
            </div>
            
            <div class="summary-card">
              <div class="metric">${summaryData.totalRevenue?.toLocaleString() || 0} ฿</div>
              <div class="metric-label">รายได้รวม</div>
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
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Daily summary email sent to ${adminEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending daily summary email:', error);
    throw error;
  }
};

// ระบบส่งอีเมลแจ้งเตือนแอดมินอัตโนมัติ
export const automaticAdminEmailNotifications = {
  // ส่งแจ้งเตือนการจองใหม่
  onNewBooking: async (bookingData, userData) => {
    try {
      // ดึงรายชื่อแอดมินทั้งหมด
      const { sql } = await import('../db/database.js');
      const admins = await sql`
        SELECT email, first_name, last_name 
        FROM users 
        WHERE role = 'admin' AND email IS NOT NULL
      `;

      const bookingInfo = {
        bookingId: bookingData.id,
        bookingReference: bookingData.booking_reference || `BK${bookingData.id}`,
        customerName: `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ไม่ระบุชื่อ',
        customerEmail: userData.email,
        customerPhone: userData.phone,
        hotelName: bookingData.hotel_name || 'ไม่ระบุโรงแรม',
        roomTypeName: bookingData.room_type_name || 'ไม่ระบุประเภทห้อง',
        checkInDate: bookingData.check_in_date,
        checkOutDate: bookingData.check_out_date,
        guests: bookingData.guests,
        totalPrice: bookingData.total_price,
        specialRequests: bookingData.special_requests
      };

      // ส่งอีเมลให้แอดมินทุกคน
      for (const admin of admins) {
        try {
          await sendNewBookingAdminEmail(admin.email, bookingInfo);
          console.log(`✅ [ADMIN-EMAIL] New booking notification sent to admin: ${admin.email}`);
        } catch (emailError) {
          console.error(`❌ [ADMIN-EMAIL] Failed to send to ${admin.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('❌ [ADMIN-EMAIL] Failed to send new booking notifications:', error);
    }
  },

  // ส่งแจ้งเตือนการชำระเงิน
  onPaymentReceived: async (bookingData, userData) => {
    try {
      const { sql } = await import('../db/database.js');
      const admins = await sql`
        SELECT email, first_name, last_name 
        FROM users 
        WHERE role = 'admin' AND email IS NOT NULL
      `;

      const paymentInfo = {
        bookingId: bookingData.id,
        bookingReference: bookingData.booking_reference || `BK${bookingData.id}`,
        customerName: `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ไม่ระบุชื่อ',
        totalPrice: bookingData.total_price
      };

      for (const admin of admins) {
        try {
          await sendPaymentReceivedAdminEmail(admin.email, paymentInfo);
          console.log(`✅ [ADMIN-EMAIL] Payment notification sent to admin: ${admin.email}`);
        } catch (emailError) {
          console.error(`❌ [ADMIN-EMAIL] Failed to send payment notification to ${admin.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('❌ [ADMIN-EMAIL] Failed to send payment notifications:', error);
    }
  },

  // ส่งแจ้งเตือนการยกเลิก
  onBookingCancelled: async (bookingData, userData, reason) => {
    try {
      const { sql } = await import('../db/database.js');
      const admins = await sql`
        SELECT email, first_name, last_name 
        FROM users 
        WHERE role = 'admin' AND email IS NOT NULL
      `;

      const cancellationInfo = {
        bookingId: bookingData.id,
        bookingReference: bookingData.booking_reference || `BK${bookingData.id}`,
        customerName: `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim() || 'ไม่ระบุชื่อ',
        totalPrice: bookingData.total_price,
        reason: reason
      };

      for (const admin of admins) {
        try {
          await sendCancellationAdminEmail(admin.email, cancellationInfo);
          console.log(`✅ [ADMIN-EMAIL] Cancellation notification sent to admin: ${admin.email}`);
        } catch (emailError) {
          console.error(`❌ [ADMIN-EMAIL] Failed to send cancellation notification to ${admin.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('❌ [ADMIN-EMAIL] Failed to send cancellation notifications:', error);
    }
  }
};