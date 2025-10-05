// แก้ไข bed_type ในตาราง rooms ให้ตรงกับ room_type_id
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixBedTypeInRoomsTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking',
      port: 3306
    });

    console.log('🔗 Connected to database: hotel_booking');
    
    // 1. ตรวจสอบสถานะปัจจุบัน
    console.log('\n=== 📊 Current bed_type Issues ===');
    const [currentIssues] = await connection.execute(`
      SELECT 
        room_number,
        room_type_id,
        bed_type as current_bed_type
      FROM rooms 
      WHERE 
        (room_type_id = 8 AND bed_type != 'single') OR
        (room_type_id = 10 AND bed_type != 'double')
      ORDER BY room_number
    `);
    
    console.log(`Found ${currentIssues.length} rooms with incorrect bed_type:`);
    currentIssues.forEach(room => {
      const correctType = room.room_type_id === 8 ? 'single' : 'double';
      console.log(`  Room ${room.room_number}: type_id=${room.room_type_id}, bed_type="${room.current_bed_type}" (should be "${correctType}")`);
    });
    
    // 2. แก้ไข bed_type สำหรับห้อง Single (room_type_id = 8)
    console.log('\n🔧 Fixing Single rooms (room_type_id = 8)...');
    const [singleUpdate] = await connection.execute(`
      UPDATE rooms 
      SET bed_type = 'single', updated_at = NOW()
      WHERE room_type_id = 8
    `);
    console.log(`✅ Updated ${singleUpdate.affectedRows} Single rooms`);
    
    // 3. แก้ไข bed_type สำหรับห้อง Double (room_type_id = 10)
    console.log('\n🔧 Fixing Double rooms (room_type_id = 10)...');
    const [doubleUpdate] = await connection.execute(`
      UPDATE rooms 
      SET bed_type = 'double', updated_at = NOW()
      WHERE room_type_id = 10
    `);
    console.log(`✅ Updated ${doubleUpdate.affectedRows} Double rooms`);
    
    // 4. ตรวจสอบผลลัพธ์
    console.log('\n=== ✅ Verification ===');
    const [verification] = await connection.execute(`
      SELECT 
        bed_type,
        room_type_id,
        COUNT(*) as count,
        GROUP_CONCAT(room_number ORDER BY room_number SEPARATOR ',') as sample_rooms
      FROM rooms 
      GROUP BY bed_type, room_type_id
      ORDER BY room_type_id
    `);
    
    verification.forEach(row => {
      console.log(`${row.bed_type} beds (type_id ${row.room_type_id}): ${row.count} rooms`);
      console.log(`  Sample: ${row.sample_rooms}`);
    });
    
    // 5. ตรวจสอบว่ายังมีปัญหาหรือไม่
    const [remainingIssues] = await connection.execute(`
      SELECT COUNT(*) as issue_count
      FROM rooms 
      WHERE 
        (room_type_id = 8 AND bed_type != 'single') OR
        (room_type_id = 10 AND bed_type != 'double')
    `);
    
    if (remainingIssues[0].issue_count === 0) {
      console.log('\n🎉 All bed_type issues fixed successfully!');
    } else {
      console.log(`\n⚠️ Still ${remainingIssues[0].issue_count} issues remaining`);
    }
    
    // 6. แสดง SQL สำหรับตรวจสอบใน phpMyAdmin
    console.log('\n=== 🔍 SQL for phpMyAdmin Verification ===');
    console.log('1. Check bed_type distribution:');
    console.log('   SELECT bed_type, room_type_id, COUNT(*) FROM rooms GROUP BY bed_type, room_type_id;');
    console.log('');
    console.log('2. Check all rooms with details:');
    console.log('   SELECT room_number, room_type_id, bed_type FROM rooms ORDER BY CAST(room_number AS UNSIGNED);');
    
    await connection.end();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixBedTypeInRoomsTable();