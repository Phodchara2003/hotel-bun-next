const mysql = require('mysql2/promise');
require('dotenv').config();

async function testBookingQuery() {
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

    // Test the detailed query that's used in the admin API
    const testQuery = `
      SELECT 
        b.id as booking_id,
        b.guest_name,
        ps.id as payment_slip_id,
        ps.file_path,
        ps.amount,
        ps.status as payment_status
      FROM bookings b
      LEFT JOIN payment_slips ps ON b.id = ps.booking_id
      WHERE b.id IN (15, 16, 17)
      ORDER BY b.id DESC
    `;

    console.log('📝 Testing booking query with payment slips...');
    const [rows] = await connection.execute(testQuery);
    
    console.log(`✅ Found ${rows.length} rows:`);
    rows.forEach(row => {
      console.log(`  Booking ${row.booking_id}: ${row.guest_name}`);
      if (row.payment_slip_id) {
        console.log(`    - Payment Slip ${row.payment_slip_id}: ${row.file_path}, Amount: ${row.amount}, Status: ${row.payment_status}`);
      } else {
        console.log(`    - No payment slip`);
      }
    });

    // Test grouping logic
    console.log('\n📊 Testing grouping logic:');
    const bookingsMap = new Map();
    
    rows.forEach(row => {
      const bookingId = row.booking_id;
      
      if (!bookingsMap.has(bookingId)) {
        bookingsMap.set(bookingId, {
          id: row.booking_id,
          guest_name: row.guest_name,
          payment_slips: []
        });
      }
      
      // Add payment slip if exists
      if (row.payment_slip_id) {
        const booking = bookingsMap.get(bookingId);
        booking.payment_slips.push({
          id: row.payment_slip_id,
          file_path: row.file_path,
          amount: row.amount,
          status: row.payment_status
        });
      }
    });
    
    const groupedBookings = Array.from(bookingsMap.values());
    groupedBookings.forEach(booking => {
      console.log(`  Booking ${booking.id}: ${booking.guest_name} - ${booking.payment_slips.length} payment slips`);
      booking.payment_slips.forEach(slip => {
        console.log(`    - Slip ${slip.id}: ${slip.file_path}, ${slip.amount}, ${slip.status}`);
      });
    });

    await connection.end();
    console.log('\n🔚 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testBookingQuery();