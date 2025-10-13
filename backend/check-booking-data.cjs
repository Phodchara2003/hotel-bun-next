/**
 * ตรวจสอบข้อมูลที่จำเป็นสำหรับการจอง
 */

const mysql = require('mysql2/promise');

// MySQL Connection Configuration
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

async function checkBookingData() {
  let connection = null;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // ตรวจสอบ hotels
    console.log('🏨 ตรวจสอบโรงแรมที่มีอยู่:');
    const [hotels] = await connection.execute('SELECT id, name FROM hotels ORDER BY id');
    hotels.forEach(hotel => {
      console.log(`  - ID: ${hotel.id}, Name: ${hotel.name}`);
    });
    
    // ตรวจสอบ room_types
    console.log('\n🛏️ ตรวจสอบประเภทห้องที่มีอยู่:');
    const [roomTypes] = await connection.execute('SELECT id, name, hotel_id FROM room_types ORDER BY id');
    roomTypes.forEach(rt => {
      console.log(`  - ID: ${rt.id}, Name: ${rt.name}, Hotel ID: ${rt.hotel_id}`);
    });
    
    // ตรวจสอบ rooms
    console.log('\n🚪 ตรวจสอบห้องที่มีอยู่:');
    const [rooms] = await connection.execute(`
      SELECT r.id, r.room_number, r.bed_type, r.status, rt.name as room_type_name, rt.hotel_id
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.status = 'available'
      ORDER BY rt.hotel_id, r.room_number
      LIMIT 10
    `);
    rooms.forEach(room => {
      console.log(`  - Room ${room.room_number} (${room.bed_type}) - ${room.room_type_name} - Hotel ID: ${room.hotel_id}`);
    });
    
    if (hotels.length > 0 && rooms.length > 0) {
      const firstHotel = hotels[0];
      const firstRoom = rooms[0];
      
      console.log('\n✅ ข้อมูลที่แนะนำสำหรับการทดสอบ:');
      console.log(`   user_id: 2`);
      console.log(`   hotel_id: ${firstHotel.id}`);
      console.log(`   bed_type: '${firstRoom.bed_type}'`);
      console.log(`   room available: ${firstRoom.room_number}`);
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkBookingData();