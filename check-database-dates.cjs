// ตรวจสอบข้อมูลการจองในฐานข้อมูล
const mysql = require('mysql2/promise');

async function checkBookingDatesInDatabase() {
  let connection;
  
  try {
    console.log('🔍 เชื่อมต่อฐานข้อมูล MySQL...');
    
    // เชื่อมต่อฐานข้อมูล (ใช้ค่าเดียวกับ mysql-server.cjs)
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
    console.log('');
    
    // ดึงข้อมูลการจองทั้งหมด
    console.log('📋 ข้อมูลการจองทั้งหมดในฐานข้อมูล:');
    const [bookings] = await connection.execute(`
      SELECT 
        b.id,
        b.user_id,
        b.check_in_date,
        b.check_out_date,
        b.booking_reference,
        b.guest_name,
        b.status,
        b.created_at,
        h.name as hotel_name,
        rt.name as room_type_name
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);
    
    console.log(`พบการจอง ${bookings.length} รายการ:`);
    console.log('');
    
    bookings.forEach((booking, index) => {
      console.log(`📋 การจอง ${index + 1}:`);
      console.log(`  - ID: ${booking.id}`);
      console.log(`  - User ID: ${booking.user_id}`);
      console.log(`  - Booking Reference: ${booking.booking_reference}`);
      console.log(`  - Guest Name: ${booking.guest_name}`);
      console.log(`  - Status: ${booking.status}`);
      console.log(`  - Hotel: ${booking.hotel_name}`);
      console.log(`  - Room Type: ${booking.room_type_name}`);
      console.log(`  - Check-in Date (raw): ${booking.check_in_date}`);
      console.log(`  - Check-in Date (type): ${typeof booking.check_in_date}`);
      console.log(`  - Check-out Date (raw): ${booking.check_out_date}`);
      console.log(`  - Check-out Date (type): ${typeof booking.check_out_date}`);
      console.log(`  - Created At: ${booking.created_at}`);
      
      // ทดสอบการแปลงวันที่
      if (booking.check_in_date) {
        try {
          const checkInAsDate = new Date(booking.check_in_date);
          const checkOutAsDate = new Date(booking.check_out_date);
          
          console.log(`  - Check-in as Date: ${checkInAsDate}`);
          console.log(`  - Check-out as Date: ${checkOutAsDate}`);
          console.log(`  - Check-in valid: ${!isNaN(checkInAsDate.getTime())}`);
          console.log(`  - Check-out valid: ${!isNaN(checkOutAsDate.getTime())}`);
          
          // ทดสอบการ format ด้วย dateUtils
          const { formatDateThai } = require('./frontend/lib/dateUtils.js');
          
          if (typeof booking.check_in_date === 'string') {
            console.log(`  - Formatted check-in: ${formatDateThai(booking.check_in_date)}`);
            console.log(`  - Formatted check-out: ${formatDateThai(booking.check_out_date)}`);
          } else {
            console.log(`  - Date object check-in: ${booking.check_in_date}`);
            console.log(`  - Date object check-out: ${booking.check_out_date}`);
            
            // แปลง Date object เป็น string
            const checkInString = booking.check_in_date.toISOString().split('T')[0];
            const checkOutString = booking.check_out_date.toISOString().split('T')[0];
            
            console.log(`  - Check-in as string: ${checkInString}`);
            console.log(`  - Check-out as string: ${checkOutString}`);
            console.log(`  - Formatted check-in (from Date): ${formatDateThai(checkInString)}`);
            console.log(`  - Formatted check-out (from Date): ${formatDateThai(checkOutString)}`);
          }
        } catch (error) {
          console.log(`  - ❌ Error formatting dates: ${error.message}`);
        }
      }
      
      console.log('  ' + '─'.repeat(50));
    });
    
    console.log('');
    console.log('🔍 การวิเคราะห์ปัญหา:');
    
    if (bookings.length > 0) {
      const firstBooking = bookings[0];
      console.log('📋 ตัวอย่างการจองแรก:');
      console.log(`  - check_in_date type: ${typeof firstBooking.check_in_date}`);
      console.log(`  - check_in_date value: ${firstBooking.check_in_date}`);
      
      if (firstBooking.check_in_date instanceof Date) {
        console.log('⚠️ ปัญหา: MySQL ส่งกลับมาเป็น Date object ไม่ใช่ string');
        console.log('💡 แนวทางแก้ไข: ต้องแปลง Date object เป็น string ใน backend');
      } else if (typeof firstBooking.check_in_date === 'string') {
        console.log('✅ ข้อมูลเป็น string แล้ว ปัญหาอาจอยู่ที่ frontend');
      }
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
    }
  }
}

// เรียกใช้ฟังก์ชัน
checkBookingDatesInDatabase();