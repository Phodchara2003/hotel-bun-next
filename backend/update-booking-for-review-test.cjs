const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateBookingForReviewTest() {
  try {
    console.log('🔧 Connecting to database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hotel_booking'
    });

    console.log('✅ Connected to database');

    // อัปเดตการจองใดๆ ให้เป็นสถานะ completed และกำหนดวันที่เช็คเอาท์เป็นในอดีต
    const updateQuery = `
      UPDATE bookings 
      SET 
        status = 'completed',
        check_out_date = '2025-10-10',
        check_in_date = '2025-10-08'
      WHERE id = (
        SELECT id FROM (
          SELECT id FROM bookings 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as temp
      )
    `;

    const [result] = await connection.execute(updateQuery);
    console.log('📝 Updated booking result:', result);

    // ดึงข้อมูลการจองที่อัปเดต
    const [bookings] = await connection.execute(
      'SELECT * FROM bookings WHERE status = "completed" ORDER BY created_at DESC LIMIT 1'
    );

    if (bookings.length > 0) {
      console.log('✅ Updated booking for review test:', {
        id: bookings[0].id,
        status: bookings[0].status,
        check_in_date: bookings[0].check_in_date,
        check_out_date: bookings[0].check_out_date,
        user_id: bookings[0].user_id
      });
    }

    await connection.end();
    console.log('🔒 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error updating booking:', error);
  }
}

updateBookingForReviewTest();