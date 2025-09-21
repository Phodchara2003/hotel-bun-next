const mysql = require('mysql2/promise');

async function checkBooking20() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });

    const [bookings] = await connection.execute(
      'SELECT id, user_id, guest_name, total_price FROM bookings WHERE id = 20'
    );
    
    console.log('📋 Booking 20 Details:');
    if (bookings.length > 0) {
      const booking = bookings[0];
      console.log(`ID: ${booking.id}, User: ${booking.user_id}, Guest: ${booking.guest_name}, Total: ${booking.total_price} THB`);
    } else {
      console.log('❌ Booking 20 not found!');
    }

    // Also check all bookings to see available IDs
    const [allBookings] = await connection.execute(
      'SELECT id, guest_name, total_price FROM bookings ORDER BY id DESC LIMIT 5'
    );
    
    console.log('\n📋 Recent Bookings:');
    allBookings.forEach(booking => {
      console.log(`ID: ${booking.id}, Guest: ${booking.guest_name}, Total: ${booking.total_price} THB`);
    });

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBooking20();