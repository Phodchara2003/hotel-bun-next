const mysql = require('mysql2/promise');

async function checkRooms() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });

    // Check if rooms exist
    const [rooms] = await connection.execute('SELECT id, name, type FROM room_types LIMIT 5');
    console.log('🏠 Existing rooms:', rooms);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRooms();