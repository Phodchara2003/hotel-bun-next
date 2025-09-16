const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestCancellationRequest() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    });
    
    console.log('🔍 Creating test cancellation request...');
    
    // Check if there are any bookings to use for test
    const [bookings] = await connection.execute('SELECT id, user_id FROM bookings LIMIT 1');
    
    if (bookings.length === 0) {
      console.log('❌ No bookings found. Please create a booking first.');
      await connection.end();
      return;
    }
    
    const booking = bookings[0];
    
    // Create a test cancellation request
    const [result] = await connection.execute(`
      INSERT INTO cancellation_requests (booking_id, user_id, reason, status, requested_at)
      VALUES (?, ?, ?, 'pending', NOW())
    `, [booking.id, booking.user_id, 'เปลี่ยนแปลงแผนการเดินทางฉุกเฉิน']);
    
    console.log(`✅ Test cancellation request created with ID: ${result.insertId}`);
    console.log(`   Booking ID: ${booking.id}`);
    console.log(`   User ID: ${booking.user_id}`);
    console.log(`   Reason: เปลี่ยนแปลงแผนการเดินทางฉุกเฉิน`);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  }
}

createTestCancellationRequest();