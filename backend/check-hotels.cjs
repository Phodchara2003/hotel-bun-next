const mysql = require('mysql2/promise');

async function checkHotels() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });

    // Check existing hotels
    const [hotels] = await connection.execute('SELECT id, name FROM hotels LIMIT 5');
    console.log('🏨 Existing hotels:', hotels);

    // Check what hotel_id the existing rooms have
    const [roomsWithHotels] = await connection.execute(`
      SELECT r.id, r.name, r.hotel_id, h.name as hotel_name 
      FROM room_types r 
      LEFT JOIN hotels h ON r.hotel_id = h.id 
      LIMIT 5
    `);
    console.log('🏠 Rooms with hotel info:', roomsWithHotels);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkHotels();