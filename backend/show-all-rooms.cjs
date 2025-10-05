// แสดงรายละเอียดห้องทั้งหมดสำหรับเช็คใน phpMyAdmin
require('dotenv').config();
const mysql = require('mysql2/promise');

async function showAllRoomsForPhpMyAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678', 
      database: 'hotel_booking',
      port: 3306
    });

    console.log('🔗 Connected to database: hotel_booking');
    
    // แสดงข้อมูลห้องทั้งหมด
    const [allRooms] = await connection.execute(`
      SELECT 
        id,
        room_number, 
        room_type_id,
        hotel_id,
        status,
        floor,
        created_at,
        updated_at
      FROM rooms 
      ORDER BY CAST(room_number AS UNSIGNED)
    `);
    
    console.log('\n=== 📋 ALL ROOMS IN DATABASE ===');
    console.log('Format: ID | Room# | Type | Hotel | Status | Floor | Created | Updated');
    console.log('─'.repeat(100));
    
    allRooms.forEach(room => {
      const typeLabel = room.room_type_id === 8 ? 'Single' : 'Double';
      console.log(`${room.id.toString().padStart(3)} | ${room.room_number.padStart(5)} | ${room.room_type_id.toString().padStart(2)} (${typeLabel}) | ${room.hotel_id.toString().padStart(5)} | ${room.status.padEnd(9)} | ${room.floor.toString().padStart(5)} | ${room.created_at.toISOString().split('T')[0]} | ${room.updated_at.toISOString().split('T')[0]}`);
    });
    
    // สรุปจำนวน
    console.log('\n=== 📊 SUMMARY ===');
    const singleRooms = allRooms.filter(r => r.room_type_id === 8);
    const doubleRooms = allRooms.filter(r => r.room_type_id === 10);
    
    console.log(`Total rooms: ${allRooms.length}`);
    console.log(`Single rooms (type_id 8): ${singleRooms.length} rooms`);
    console.log(`  Rooms: ${singleRooms.map(r => r.room_number).join(', ')}`);
    console.log(`Double rooms (type_id 10): ${doubleRooms.length} rooms`);
    console.log(`  Rooms: ${doubleRooms.map(r => r.room_number).join(', ')}`);
    
    // SQL commands สำหรับ phpMyAdmin
    console.log('\n=== 🔍 SQL COMMANDS FOR PHPMYADMIN ===');
    console.log('1. Check room count by type:');
    console.log('   SELECT room_type_id, COUNT(*) as count FROM rooms GROUP BY room_type_id ORDER BY room_type_id;');
    console.log('');
    console.log('2. View all rooms:');
    console.log('   SELECT * FROM rooms ORDER BY CAST(room_number AS UNSIGNED);');
    console.log('');
    console.log('3. Check room types details:');
    console.log('   SELECT rt.id, rt.name, rt.bed_type, COUNT(r.id) as room_count FROM room_types rt LEFT JOIN rooms r ON rt.id = r.room_type_id GROUP BY rt.id;');
    
    await connection.end();
    console.log('\n✅ Connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showAllRoomsForPhpMyAdmin();