// สลับจำนวนห้องระหว่างเตียงเดี่ยวและเตียงคู่
require('dotenv').config();
const mysql = require('mysql2/promise');

async function swapRoomCounts() {
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
    
    // 2. เริ่มทำการสลับ
    console.log('\n=== 🔄 Starting Room Swap Process ===');
    
    // ลบห้องที่เกินออกจาก Single Room (เหลือ 6 ห้อง)
    console.log('📝 Step 1: Remove excess Single rooms (keep only 6)');
    const [singleRoomsToRemove] = await connection.execute(`
      SELECT id, room_number 
      FROM rooms 
      WHERE room_type_id = 8 
      ORDER BY room_number DESC 
      LIMIT 22
    `);
    
    console.log(`   Removing ${singleRoomsToRemove.length} Single rooms:`);
    
    for (const room of singleRoomsToRemove) {
      await connection.execute('DELETE FROM rooms WHERE id = ?', [room.id]);
      console.log(`   - Removed room ${room.room_number}`);
    }
    
    // สร้างห้องใหม่สำหรับ Double Room (เพิ่มเป็น 28 ห้อง)
    console.log('\n📝 Step 2: Add new Double rooms (total 28)');
    
    // ใช้หมายเลขห้องที่ถูกลบไปแล้ว (จาก Single Room)
    const newRoomNumbers = singleRoomsToRemove.map(room => room.room_number);
    
    console.log(`   Adding ${newRoomNumbers.length} new Double rooms`);
    
    for (const roomNumber of newRoomNumbers) {
      const floor = Math.floor(parseInt(roomNumber) / 100);
      
      await connection.execute(`
        INSERT INTO rooms (room_number, room_type_id, hotel_id, status, floor, created_at, updated_at)
        VALUES (?, 10, 2, 'available', ?, NOW(), NOW())
      `, [roomNumber, floor]);
      
      console.log(`   + Added Double room ${roomNumber} on floor ${floor}`);
    }
    
    // 3. ตรวจสอบผลลัพธ์
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
        console.log(`   Rooms: ${rooms.slice(0, 5).join(', ')}${rooms.length > 5 ? `... (+${rooms.length - 5} more)` : ''}`);
      }
    });
    
    // 4. ตรวจสอบสถิติรวม
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
    console.log('\n🎉 Room swap completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

swapRoomCounts();