// สร้างห้องใหม่ให้ถูกต้องตามที่ต้องการ
require('dotenv').config();
const mysql = require('mysql2/promise');

async function createCorrectRooms() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking',
      port: 3306
    });

    console.log('🔗 Connected to database');
    
    // 1. ตรวจสอบสถานะปัจจุบัน
    console.log('\n=== 📊 Current Room Status ===');
    const [currentStatus] = await connection.execute(`
      SELECT 
        rt.id, 
        rt.name, 
        rt.bed_type,
        COUNT(r.id) as current_count
      FROM room_types rt
      LEFT JOIN rooms r ON rt.id = r.room_type_id
      WHERE rt.id IN (8, 10)
      GROUP BY rt.id, rt.name, rt.bed_type
      ORDER BY rt.id
    `);
    
    currentStatus.forEach(row => {
      console.log(`${row.id}. ${row.name} (${row.bed_type}): ${row.current_count} rooms`);
    });
    
    // 2. สร้างห้อง Single Room (6 ห้อง)
    console.log('\n📝 Creating 6 Single Rooms (507-512)');
    for (let i = 507; i <= 512; i++) {
      const roomNumber = i.toString();
      const floor = Math.floor(i / 100);
      
      await connection.execute(`
        INSERT INTO rooms (room_number, room_type_id, hotel_id, status, floor, created_at, updated_at)
        VALUES (?, 8, 2, 'available', ?, NOW(), NOW())
      `, [roomNumber, floor]);
      
      console.log(`   + Added Single room ${roomNumber} on floor ${floor}`);
    }
    
    // 3. สร้างห้อง Double Room เพิ่ม (22 ห้อง) รวมเป็น 28 ห้อง
    console.log('\n📝 Creating 22 additional Double Rooms');
    
    // ห้อง 513-517 (5 ห้อง)
    for (let i = 513; i <= 517; i++) {
      const roomNumber = i.toString();
      const floor = Math.floor(i / 100);
      
      await connection.execute(`
        INSERT INTO rooms (room_number, room_type_id, hotel_id, status, floor, created_at, updated_at)
        VALUES (?, 10, 2, 'available', ?, NOW(), NOW())
      `, [roomNumber, floor]);
      
      console.log(`   + Added Double room ${roomNumber} on floor ${floor}`);
    }
    
    // ห้อง 601-617 (17 ห้อง)
    for (let i = 601; i <= 617; i++) {
      const roomNumber = i.toString();
      const floor = Math.floor(i / 100);
      
      await connection.execute(`
        INSERT INTO rooms (room_number, room_type_id, hotel_id, status, floor, created_at, updated_at)
        VALUES (?, 10, 2, 'available', ?, NOW(), NOW())
      `, [roomNumber, floor]);
      
      console.log(`   + Added Double room ${roomNumber} on floor ${floor}`);
    }
    
    // 4. ตรวจสอบผลลัพธ์
    console.log('\n=== ✅ Final Room Status ===');
    const [finalStatus] = await connection.execute(`
      SELECT 
        rt.id, 
        rt.name, 
        rt.bed_type,
        COUNT(r.id) as final_count,
        GROUP_CONCAT(r.room_number ORDER BY r.room_number) as room_numbers
      FROM room_types rt
      LEFT JOIN rooms r ON rt.id = r.room_type_id
      WHERE rt.id IN (8, 10)
      GROUP BY rt.id, rt.name, rt.bed_type
      ORDER BY rt.id
    `);
    
    finalStatus.forEach(row => {
      console.log(`\n${row.id}. ${row.name} (${row.bed_type}): ${row.final_count} rooms`);
      if (row.room_numbers) {
        const rooms = row.room_numbers.split(',');
        console.log(`   Rooms: ${rooms.join(', ')}`);
      }
    });
    
    // 5. ตรวจสอบสถิติรวม
    const [totalStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_rooms,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_rooms
      FROM rooms
    `);
    
    console.log(`\n📊 Total Statistics:`);
    console.log(`   Total rooms: ${totalStats[0].total_rooms}`);
    console.log(`   Available rooms: ${totalStats[0].available_rooms}`);
    
    await connection.end();
    console.log('\n🎉 Room creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createCorrectRooms();