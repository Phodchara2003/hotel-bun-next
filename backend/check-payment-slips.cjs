const mysql = require('mysql2/promise');

async function checkPaymentSlips() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });

    // ตรวจสอบตาราง payment_slips
    const [tables] = await connection.execute("SHOW TABLES LIKE 'payment_slips'");
    console.log('📋 Payment slips table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // ตรวจสอบข้อมูลทั้งหมด
      const [allSlips] = await connection.execute('SELECT * FROM payment_slips LIMIT 10');
      console.log('📊 All payment slips (first 10):', allSlips);
      
      // ตรวจสอบ payment slips สําหรับ booking ID 25
      const [slips25] = await connection.execute('SELECT * FROM payment_slips WHERE booking_id = 25');
      console.log('🎯 Payment slips for booking 25:', slips25);
      
      // ตรวจสอบจํานวนทั้งหมด
      const [count] = await connection.execute('SELECT COUNT(*) as total FROM payment_slips');
      console.log('📈 Total payment slips:', count[0].total);
      
      // ตรวจสอบ booking IDs ที่มี payment slips
      const [bookingIds] = await connection.execute('SELECT DISTINCT booking_id FROM payment_slips ORDER BY booking_id');
      console.log('🏷️ Booking IDs with payment slips:', bookingIds.map(row => row.booking_id));
    } else {
      console.log('❌ Payment slips table does not exist');
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPaymentSlips();