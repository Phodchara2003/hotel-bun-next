const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTestSlipForBooking18() {
  try {
    console.log('🔄 Connecting to MySQL database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'hotel_booking',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL database successfully!');

    // Get booking 18 details
    const [bookingDetails] = await connection.execute('SELECT * FROM bookings WHERE id = 18');
    if (bookingDetails.length === 0) {
      console.log('❌ Booking 18 not found!');
      await connection.end();
      return;
    }

    const booking = bookingDetails[0];
    console.log(`📋 Found booking: ${booking.guest_name} - ${booking.total_price}`);

    // Create a test payment slip for booking 18
    const [insertResult] = await connection.execute(`
      INSERT INTO payment_slips 
      (booking_id, user_id, file_name, original_name, file_path, amount, payment_date, status) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
    `, [
      18,                                      // booking_id
      booking.user_id,                         // user_id
      'payment-slip-booking-18.jpg',           // file_name
      'payment-slip-booking-18.jpg',           // original_name
      'payment-slip-booking-18.jpg',           // file_path
      booking.total_price,                     // amount (548.00)
      'pending'                                // status
    ]);

    console.log(`✅ Created payment slip with ID: ${insertResult.insertId}`);

    // Verify the creation
    const [verification] = await connection.execute(`
      SELECT 
        b.id as booking_id,
        b.guest_name,
        b.total_price,
        ps.id as slip_id,
        ps.file_path,
        ps.amount,
        ps.status
      FROM bookings b
      LEFT JOIN payment_slips ps ON b.id = ps.booking_id
      WHERE b.id = 18
    `);

    console.log('\n📊 Verification Result:');
    verification.forEach(row => {
      if (row.slip_id) {
        console.log(`✅ Booking ${row.booking_id}: ${row.guest_name} (${row.total_price})`);
        console.log(`   → Slip ${row.slip_id}: ${row.file_path} (${row.amount}, ${row.status})`);
      } else {
        console.log(`❌ Booking ${row.booking_id}: No payment slip found`);
      }
    });

    await connection.end();
    console.log('\n🔚 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestSlipForBooking18();