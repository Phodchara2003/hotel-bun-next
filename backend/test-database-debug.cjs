const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection and booking data...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('✅ Database connected successfully');
    
    // Check if booking 41 exists
    const [bookings] = await connection.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [41]
    );
    
    console.log('📊 Booking 41 data:', bookings);
    
    if (bookings.length > 0) {
      const booking = bookings[0];
      console.log('📝 Booking status:', booking.status);
      console.log('📝 Check-in time:', booking.actual_check_in_time);
      console.log('📝 Check-out time:', booking.actual_check_out_time);
    }
    
    // Check table structure
    const [columns] = await connection.execute(
      'DESCRIBE bookings'
    );
    
    console.log('📊 Bookings table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testDatabaseConnection();