const mysql = require('mysql2/promise');

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

async function checkAllRoomTypes() {
  let connection;
  
  try {
    console.log('🔍 Checking all room types in database...');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL connected successfully');
    
    // ดูข้อมูลทั้งหมดในตาราง room_types
    const [rows] = await connection.execute(`
      SELECT id, name, description, type, bed_type, price_per_night, hotel_id
      FROM room_types 
      ORDER BY id
    `);
    
    console.log(`\n📋 Found ${rows.length} room types:`);
    rows.forEach(room => {
      console.log(`   - ID: ${room.id}, Name: ${room.name}, Type: ${room.type}, Bed: ${room.bed_type}, Price: ฿${room.price_per_night}, Hotel: ${room.hotel_id}`);
    });
    
    console.log('\n✅ Check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking room types:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔚 Database connection closed');
    }
  }
}

checkAllRoomTypes();