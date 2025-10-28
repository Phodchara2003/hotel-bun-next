// Check database booking status

const mysql = require('mysql2/promise');

async function checkBookingStatus() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔗 Connected to database');
    
    // Check specific bookings mentioned
    const bookingRefs = ['HTL800420', 'HTL464488', 'HTL487350', 'HTL452597', 'HTL841041', 'HTL635676', 'HTL727164'];
    
    console.log('\n📋 === Checking booking status in database ===');
    
    for (const ref of bookingRefs) {
      const [bookings] = await connection.execute(`
        SELECT id, booking_reference, status, check_in_date, check_out_date, created_at, updated_at
        FROM bookings 
        WHERE booking_reference = ?
      `, [ref]);
      
      if (bookings.length > 0) {
        const booking = bookings[0];
        console.log(`\n📌 ${ref}:`);
        console.log(`   ID: ${booking.id}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Check-in: ${booking.check_in_date}`);
        console.log(`   Check-out: ${booking.check_out_date}`);
        console.log(`   Created: ${booking.created_at}`);
        console.log(`   Updated: ${booking.updated_at}`);
      } else {
        console.log(`\n❌ ${ref}: Not found`);
      }
    }
    
    // Check all bookings with their current status
    console.log('\n📊 === All bookings status summary ===');
    const [allBookings] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM bookings 
      GROUP BY status
      ORDER BY count DESC
    `);
    
    allBookings.forEach(row => {
      console.log(`   ${row.status}: ${row.count} bookings`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkBookingStatus();