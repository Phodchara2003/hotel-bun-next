// ตรวจสอบตาราง rooms โดยตรง
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkRoomsTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking',
      port: 3306
    });

    console.log('🔗 Connected to database');
    
    // ตรวจสอบข้อมูลใน rooms table
    console.log('\n=== 🏠 All Rooms in Database ===');
    const [allRooms] = await connection.execute(`
      SELECT 
        r.id,
        r.room_number, 
        r.room_type_id,
        rt.name as room_type_name,
        rt.bed_type,
        r.status
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.room_number
    `);
    
    console.log(`Total rooms found: ${allRooms.length}`);
    console.log('\nAll rooms:');
    allRooms.forEach(room => {
      console.log(`Room ${room.room_number}: room_type_id=${room.room_type_id} (${room.bed_type || 'NULL'}) - ${room.room_type_name || 'NO TYPE'} [${room.status}]`);
    });
    
    // นับตาม room_type_id
    console.log('\n=== 📊 Count by room_type_id ===');
    const [countByType] = await connection.execute(`
      SELECT 
        room_type_id,
        COUNT(*) as count
      FROM rooms
      GROUP BY room_type_id
      ORDER BY room_type_id
    `);
    
    countByType.forEach(row => {
      console.log(`room_type_id ${row.room_type_id}: ${row.count} rooms`);
    });
    
    // ตรวจสอบว่าห้องไหนควรเป็น Double แต่เป็น Single
    console.log('\n=== 🔍 Rooms that should be Double (28 rooms) ===');
    const roomsThatShouldBeDouble = [
      '501', '502', '503', '504', '505', '506',
      '513', '514', '515', '516', '517',
      '601', '602', '603', '604', '605', '606', '607', '608', '609', '610',
      '611', '612', '613', '614', '615', '616', '617'
    ];
    
    for (const roomNum of roomsThatShouldBeDouble) {
      const [roomCheck] = await connection.execute(`
        SELECT r.room_number, r.room_type_id, rt.bed_type
        FROM rooms r
        LEFT JOIN room_types rt ON r.room_type_id = rt.id
        WHERE r.room_number = ?
      `, [roomNum]);
      
      if (roomCheck.length > 0) {
        const room = roomCheck[0];
        const status = room.room_type_id === 10 ? '✅' : '❌';
        console.log(`${status} Room ${room.room_number}: type_id=${room.room_type_id} (should be 10 for double)`);
      } else {
        console.log(`❌ Room ${roomNum}: NOT FOUND`);
      }
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRoomsTable();