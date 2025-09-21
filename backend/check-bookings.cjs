const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkBookings() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345678',
      database: process.env.DB_NAME || 'hotel_booking',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to MySQL database');

    // Check if bookings table exists
    const [tables] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'hotel_booking' AND table_name = 'bookings'
    `);
    
    console.log(`📋 Bookings table exists: ${tables[0].count > 0 ? 'Yes' : 'No'}`);

    if (tables[0].count > 0) {
      // Count bookings
      const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM bookings');
      console.log(`📊 Total bookings in database: ${countResult[0].total}`);

      // Check table structure
      console.log('\n📋 Bookings table structure:');
      const [columns] = await connection.execute('DESCRIBE bookings');
      columns.forEach(column => {
        console.log(`  ${column.Field} - ${column.Type} (${column.Null === 'YES' ? 'nullable' : 'not null'})`);
      });

      // Show all bookings
      const [bookings] = await connection.execute(`
        SELECT *
        FROM bookings
        ORDER BY created_at DESC
        LIMIT 3
      `);

      console.log('\n📝 Recent bookings:');
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. ID: ${booking.id}, User: ${booking.user_id}, Guest: ${booking.guest_name}, Status: ${booking.status}, Price: ${booking.total_price}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkBookings();