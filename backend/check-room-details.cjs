// ตรวจสอบข้อมูลห้องพักรายละเอียด
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkRoomDetails() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking',
      port: 3306
    });

    console.log('🔗 Connected to database');
    
    // 1. ตรวจสอบข้อมูล room_types
    console.log('\n=== 🏨 Room Types Details ===');
    const [roomTypes] = await connection.execute(`
      SELECT id, name, bed_type, type, max_guests, price_per_night
      FROM room_types 
      WHERE id IN (8, 10)
      ORDER BY id
    `);
    
    roomTypes.forEach(rt => {
      console.log(`${rt.id}. Name: "${rt.name}"`);
      console.log(`    Bed Type: "${rt.bed_type}"`);
      console.log(`    Type: "${rt.type}"`);
      console.log(`    Max Guests: ${rt.max_guests}`);
      console.log(`    Price: ${rt.price_per_night}`);
      console.log('');
    });
    
    // 2. ตรวจสอบข้อมูลห้องแต่ละห้อง
    console.log('=== 🏠 Individual Rooms ===');
    const [rooms] = await connection.execute(`
      SELECT 
        r.id, 
        r.room_number, 
        r.room_type_id,
        rt.name as room_type_name,
        rt.bed_type,
        r.status,
        r.floor
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.room_number
    `);
    
    console.log('Sample of first 10 rooms:');
    rooms.slice(0, 10).forEach(room => {
      console.log(`Room ${room.room_number}: Type=${room.room_type_id} (${room.bed_type}) - ${room.room_type_name}`);
    });
    
    if (rooms.length > 10) {
      console.log(`... and ${rooms.length - 10} more rooms`);
    }
    
    // 3. นับห้องตาม bed_type จากข้อมูลจริง
    console.log('\n=== 🛏️ Rooms by Bed Type (from actual data) ===');
    const [bedTypeCounts] = await connection.execute(`
      SELECT 
        rt.bed_type,
        rt.name as room_type_name,
        COUNT(r.id) as room_count,
        GROUP_CONCAT(r.room_number ORDER BY r.room_number SEPARATOR ',') as sample_rooms
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      GROUP BY rt.bed_type, rt.name
      ORDER BY rt.bed_type
    `);
    
    bedTypeCounts.forEach(bt => {
      console.log(`${bt.bed_type}: ${bt.room_count} rooms (${bt.room_type_name})`);
      console.log(`  Sample rooms: ${bt.sample_rooms}${bt.room_count > 5 ? '...' : ''}`);
    });
    
    // 4. ตรวจสอบว่ามีปัญหา inconsistency หรือไม่
    console.log('\n=== 🔍 Checking for Data Issues ===');
    const [inconsistentRooms] = await connection.execute(`
      SELECT 
        r.room_number,
        r.room_type_id,
        rt.name as room_type_name,
        rt.bed_type as expected_bed_type
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE 
        (r.room_type_id = 8 AND rt.bed_type != 'single') OR
        (r.room_type_id = 10 AND rt.bed_type != 'double')
    `);
    
    if (inconsistentRooms.length > 0) {
      console.log('❌ Found inconsistent room data:');
      inconsistentRooms.forEach(room => {
        console.log(`  Room ${room.room_number}: Type ${room.room_type_id} should be ${room.expected_bed_type}`);
      });
    } else {
      console.log('✅ No data inconsistencies found');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRoomDetails();