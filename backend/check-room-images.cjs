const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root', 
  password: '12345678',
  database: 'hotel_booking'
};

async function checkRoomImages() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    const [rows] = await connection.execute('SELECT id, name, images FROM room_types LIMIT 5');
    console.log('📊 Room types with images:');
    rows.forEach(room => {
      console.log(`ID: ${room.id}, Name: ${room.name}`);
      console.log(`Images: ${room.images}`);
      console.log(`Images type: ${typeof room.images}`);
      
      // Try to parse if it's a JSON string
      if (typeof room.images === 'string' && room.images.trim()) {
        try {
          const parsedImages = JSON.parse(room.images);
          console.log(`Parsed images:`, parsedImages);
        } catch (e) {
          console.log(`Failed to parse images as JSON:`, room.images);
        }
      }
      console.log('---');
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

checkRoomImages();