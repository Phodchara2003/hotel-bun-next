const mysql = require('mysql2/promise');

async function checkBookingsSchema() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    const [columns] = await connection.execute('DESCRIBE bookings');
    console.log('📋 Bookings table schema:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    const [sample] = await connection.execute('SELECT * FROM bookings LIMIT 1');
    if (sample.length > 0) {
      console.log('\n📝 Sample booking data:');
      console.log(sample[0]);
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkBookingsSchema();