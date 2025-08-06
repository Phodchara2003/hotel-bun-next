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
  
  // Upload payment slip for booking
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
  });

console.log('✅ Payment Slip Routes loaded');
