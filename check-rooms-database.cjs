// ตรวจสอบข้อมูลห้องว่างในฐานข้อมูล
const mysql = require('mysql2/promise');

async function checkRoomsDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'hotel_booking'
  });

  console.log('🔍 Checking rooms database...\n');

  // ตรวจสอบจำนวนห้องทั้งหมดในตาราง rooms
  const [rooms] = await connection.execute('SELECT * FROM rooms ORDER BY room_type_id, room_number');
  
  console.log('📊 Total rooms in database:', rooms.length);
  
  // จัดกลุ่มตาม room_type_id
  const roomTypes = {};
  rooms.forEach(room => {
    if (!roomTypes[room.room_type_id]) {
      roomTypes[room.room_type_id] = {
        total: 0,
        available: 0,
        occupied: 0,
        maintenance: 0,
        rooms: []
      };
    }
    roomTypes[room.room_type_id].total++;
    roomTypes[room.room_type_id][room.status]++;
    roomTypes[room.room_type_id].rooms.push({
      number: room.room_number,
      status: room.status,
      guest_name: room.guest_name || null
    });
  });

  // แสดงสถิติ
  for (const [typeId, stats] of Object.entries(roomTypes)) {
    console.log(`\n--- Room Type ID: ${typeId} ---`);
    console.log(`Total: ${stats.total} rooms`);
    console.log(`Available: ${stats.available} rooms`);
    console.log(`Occupied: ${stats.occupied} rooms`);
    console.log(`Maintenance: ${stats.maintenance} rooms`);
    
    console.log('Room Details:');
    stats.rooms.forEach(room => {
      const statusIcon = room.status === 'available' ? '✅' : room.status === 'occupied' ? '🔴' : '🔧';
      console.log(`  ${statusIcon} Room ${room.number}: ${room.status}${room.guest_name ? ` (${room.guest_name})` : ''}`);
    });
  }

  // ตรวจสอบข้อมูล room_types
  console.log('\n🏨 Room Types Information:');
  const [roomTypesInfo] = await connection.execute('SELECT * FROM room_types');
  roomTypesInfo.forEach(type => {
    console.log(`- ID ${type.id}: ${type.name} (${type.bed_type}) - ${type.price_per_night} บาท/คืน`);
  });

  await connection.end();
}

checkRoomsDatabase().catch(console.error);