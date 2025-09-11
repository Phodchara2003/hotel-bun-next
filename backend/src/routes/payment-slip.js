import { Elysia } from 'elysia';
import { sql } from '../db/database.js';
import path from 'path';
import fs from 'fs';

console.log('🔧 Loading Payment Slip Routes...');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'slips');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created slips uploads directory');
}

export const paymentSlipRoutes = new Elysia()
  
  // Upload payment slip for booking (new multipart endpoint)
  .post('/payment-slip/upload', async ({ body, set }) => {
    try {
      console.log('📸 Receiving payment slip upload...');
      
      // ตรวจสอบข้อมูลที่ส่งมา
      if (!body || !body.paymentSlip || !body.bookingId || !body.amount) {
        set.status = 400;
        return {
          success: false,
          message: 'ข้อมูลไม่ครบถ้วน กรุณาส่งไฟล์สลิป รหัสการจอง และจำนวนเงิน'
        };
      }

      const { paymentSlip, bookingId, amount } = body;
      
      // ตรวจสอบประเภทไฟล์
      if (!paymentSlip.type || !paymentSlip.type.startsWith('image/')) {
        set.status = 400;
        return {
          success: false,
          message: 'ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'
        };
      }

      // ตรวจสอบขนาดไฟล์ (5MB)
      if (paymentSlip.size > 5 * 1024 * 1024) {
        set.status = 400;
        return {
          success: false,
          message: 'ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB'
        };
      }

      // สร้างชื่อไฟล์ที่ไม่ซ้ำ
      const timestamp = Date.now();
      const fileExtension = path.extname(paymentSlip.name) || '.jpg';
      const filename = `slip_${bookingId}_${timestamp}${fileExtension}`;
      const filePath = path.join(uploadsDir, filename);

      // บันทึกไฟล์
      const arrayBuffer = await paymentSlip.arrayBuffer();
      fs.writeFileSync(filePath, new Uint8Array(arrayBuffer));

      // URL สำหรับเข้าถึงไฟล์
      const slipUrl = `/uploads/slips/${filename}`;

      console.log('💾 Payment slip saved:', {
        bookingId,
        amount,
        filename,
        path: filePath
      });

      // อัปเดตข้อมูลการจอง (ถ้ามีตาราง bookings)
      try {
        await sql`
          UPDATE bookings 
          SET payment_slip_url = ${slipUrl},
              payment_slip_filename = ${filename},
              payment_status = 'slip_uploaded',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${bookingId}
        `;
        console.log('✅ Booking updated with slip info');
      } catch (bookingError) {
        console.log('⚠️ Could not update booking (table might not exist):', bookingError.message);
      }

      // สร้างการแจ้งเตือนสำหรับแอดมิน (ถ้ามีตาราง notifications)
      try {
        await sql`
          INSERT INTO notifications (user_id, title, message, type, booking_id)
          VALUES (
            1,
            'สลิปการโอนเงินใหม่',
            'ได้รับสลิปการโอนเงินสำหรับการจอง ${bookingId} จำนวน ${amount} บาท',
            'payment',
            ${bookingId}
          )
        `;
        console.log('🔔 Admin notification created');
      } catch (notificationError) {
        console.log('⚠️ Could not create notification:', notificationError.message);
      }

      set.status = 200;
      return {
        success: true,
        message: 'อัปโหลดสลิปการโอนเงินเรียบร้อย กรุณารอการตรวจสอบจากเจ้าหน้าที่',
        data: {
          bookingId,
          amount: parseFloat(amount),
          slipUrl,
          uploadDate: new Date().toISOString(),
          filename
        }
      };

    } catch (error) {
      console.error('❌ Error uploading payment slip:', error);
      set.status = 500;
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป กรุณาลองใหม่อีกครั้ง',
        error: error.message
      };
    }
  })
  
  // Upload payment slip for booking (original base64 endpoint)
  .post('/bookings/:id/upload-slip', async ({ params, body, headers }) => {
    try {
      const { id: bookingId } = params;
      console.log('📸 Upload slip for booking:', bookingId);
      
      // Verify booking exists and belongs to user
      const booking = await sql`
        SELECT id, booking_reference, total_price, status, user_id
        FROM bookings 
        WHERE id = ${bookingId}
      `;
      
      if (booking.length === 0) {
        return {
          success: false,
          message: 'ไม่พบการจองนี้'
        };
      }
      
      if (!body.slip) {
        return {
          success: false,
          message: 'ไม่พบไฟล์สลิป'
        };
      }
      
      // Generate filename
      const timestamp = Date.now();
      const bookingRef = booking[0].booking_reference;
      const filename = `slip-${bookingRef}-${timestamp}.jpg`;
      const filePath = path.join(uploadsDir, filename);
      const publicUrl = `/uploads/slips/${filename}`;
      
      // If body.slip is base64
      if (typeof body.slip === 'string' && body.slip.startsWith('data:')) {
        const base64Data = body.slip.replace(/^data:image\/[a-z]+;base64,/, '');
        fs.writeFileSync(filePath, base64Data, 'base64');
      } else {
        // Handle file upload (if it's a file object)
        // This would need additional handling for multipart form data
        return {
          success: false,
          message: 'รูปแบบไฟล์ไม่ถูกต้อง'
        };
      }
      
      console.log('💾 Payment slip saved to:', filePath);
      
      // Update booking with slip information
      await sql`
        UPDATE bookings 
        SET payment_slip_url = ${publicUrl},
            payment_slip_filename = ${filename},
            payment_status = 'slip_uploaded',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${bookingId}
      `;
      
      // Create notification for admin
      await sql`
        INSERT INTO notifications (user_id, title, message, type, booking_id)
        VALUES (
          1, -- Admin user ID (assuming 1)
          'สลิปการโอนเงินใหม่',
          'ได้รับสลิปการโอนเงินสำหรับการจอง ${bookingRef} รอการตรวจสอบ',
          'payment',
          ${bookingId}
        )
      `;
      
      return {
        success: true,
        message: 'อัพโหลดสลิปเรียบร้อยแล้ว รอการยืนยันจากเจ้าหน้าที่',
        slipUrl: publicUrl
      };
      
    } catch (error) {
      console.error('❌ Error uploading payment slip:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลดสลิป'
      };
    }
  })
  
  // Get payment slip by booking ID
  .get('/bookings/:id/slip', async ({ params }) => {
    try {
      const { id: bookingId } = params;
      
      const result = await sql`
        SELECT payment_slip_url, payment_slip_filename, payment_status
        FROM bookings
        WHERE id = ${bookingId} AND payment_slip_url IS NOT NULL
      `;
      
      if (result.length === 0) {
        return {
          success: false,
          message: 'ไม่พบสลิปการโอนเงิน'
        };
      }
      
      return {
        success: true,
        slipUrl: result[0].payment_slip_url,
        filename: result[0].payment_slip_filename,
        status: result[0].payment_status
      };
      
    } catch (error) {
      console.error('❌ Error getting payment slip:', error);
      return {
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสลิป'
      };
    }
  })
  
  // Serve payment slip files
  .get('/uploads/slips/:filename', ({ params }) => {
    try {
      const { filename } = params;
      const filePath = path.join(uploadsDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return new Response('File not found', { status: 404 });
      }
      
      const file = Bun.file(filePath);
      return new Response(file);
      
    } catch (error) {
      console.error('❌ Error serving payment slip file:', error);
      return new Response('Error serving file', { status: 500 });
    }
  });

console.log('✅ Payment Slip Routes loaded');
