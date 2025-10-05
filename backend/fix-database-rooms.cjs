// ตรวจสอบและแก้ไขฐานข้อมูลจริงๆ
require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixRoomTypesInDatabase() {
  try {
    console.log('🔗 Connecting to database...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking',
      port: 3306
    });

    console.log('✅ Connected to MySQL database');
    
    // 1. แสดงข้อมูลการเชื่อมต่อ
    console.log('\n=== 📊 Database Connection Info ===');
    console.log('Connected to: localhost:3306/hotel_booking');
    
    // 2. ตรวจสอบสถานะปัจจุบัน
    console.log('\n=== 📋 Current Rooms Status ===');
    const [currentRooms] = await connection.execute(`
      SELECT 
        room_number, 
        room_type_id,
        status,
        created_at,
        updated_at
      FROM rooms 
      ORDER BY room_number
    `);
    
    console.log(`Total rooms in database: ${currentRooms.length}`);
    
    // นับตาม room_type_id
    const singleCount = currentRooms.filter(r => r.room_type_id === 8).length;
    const doubleCount = currentRooms.filter(r => r.room_type_id === 10).length;
    
    console.log(`\nCurrent distribution:`);
    console.log(`- Single rooms (type_id 8): ${singleCount}`);
    console.log(`- Double rooms (type_id 10): ${doubleCount}`);
    
    // 3. ถ้าข้อมูลยังไม่ถูกต้อง ให้แก้ไข
    if (singleCount !== 6 || doubleCount !== 28) {
      console.log('\n🔧 Data is incorrect, fixing...');
      
      // ลบข้อมูลเก่าทั้งหมด
      console.log('🗑️ Clearing all rooms...');
      await connection.execute('DELETE FROM rooms');
      console.log('✅ All rooms deleted');
      
      // สร้างห้อง Single (6 ห้อง: 507-512)
      console.log('\n➕ Creating Single rooms (507-512)...');
      for (let i = 507; i <= 512; i++) {
        await connection.execute(`
          INSERT INTO rooms (room_number, room_type_id, hotel_id, status, floor, created_at, updated_at)
          VALUES (?, 8, 2, 'available', 5, NOW(), NOW())
        `, [i.toString()]);
        console.log(`   ✅ Created Single room ${i}`);
      }
      
      // สร้างห้อง Double (28 ห้อง)
      console.log('\n➕ Creating Double rooms...');
      
      // ห้อง 501-506 (6 ห้อง)
      for (let i = 501; i <= 506; i++) {
        await connection.execute(`
          INSERT INTO rooms (room_number, room_type_id, hotel_id, status, floor, created_at, updated_at)
          VALUES (?, 10, 2, 'available', 5, NOW(), NOW())
        `, [i.toString()]);
        console.log(`   ✅ Created Double room ${i}`);
      }
      
      // ห้อง 513-517 (5 ห้อง)
      for (let i = 513; i <= 517; i++) {
        await connection.execute(`
          INSERT INTO rooms (room_number, room_type_id, hotel_id, status, floor, created_at, updated_at)
          VALUES (?, 10, 2, 'available', 5, NOW(), NOW())
        `, [i.toString()]);
        console.log(`   ✅ Created Double room ${i}`);
      }
      
      // ห้อง 601-617 (17 ห้อง)
      for (let i = 601; i <= 617; i++) {
        await connection.execute(`
          INSERT INTO rooms (room_number, room_type_id, hotel_id, status, floor, created_at, updated_at)
          VALUES (?, 10, 2, 'available', 6, NOW(), NOW())
        `, [i.toString()]);
        console.log(`   ✅ Created Double room ${i}`);
      }
      
      console.log('\n🎉 Room creation completed!');
    } else {
      console.log('\n✅ Data is already correct!');
    }
    
    // 4. ตรวจสอบผลลัพธ์สุดท้าย
    console.log('\n=== ✅ Final Verification ===');
    const [finalRooms] = await connection.execute(`
      SELECT 
        room_type_id,
        COUNT(*) as count,
        GROUP_CONCAT(room_number ORDER BY room_number SEPARATOR ',') as rooms
      FROM rooms 
      GROUP BY room_type_id
      ORDER BY room_type_id
    `);
    
    finalRooms.forEach(row => {
      const typeName = row.room_type_id === 8 ? 'Single' : 'Double';
      console.log(`\n${typeName} rooms (type_id ${row.room_type_id}): ${row.count} rooms`);
      const roomList = row.rooms.split(',');
      if (roomList.length <= 10) {
        console.log(`  Rooms: ${row.rooms}`);
      } else {
        console.log(`  Rooms: ${roomList.slice(0, 10).join(',')}... (+${roomList.length - 10} more)`);
      }
    });
    
    // 5. แสดง SQL commands สำหรับตรวจสอบใน phpMyAdmin
    console.log('\n=== 🔍 SQL Commands for phpMyAdmin Verification ===');
    console.log('SELECT room_type_id, COUNT(*) as count FROM rooms GROUP BY room_type_id;');
    console.log('SELECT * FROM rooms ORDER BY room_number;');
    
    await connection.end();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixRoomTypesInDatabase();