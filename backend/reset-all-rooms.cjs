// Reset all rooms to available status

const mysql = require('mysql2/promise');

async function resetAllRoomsToAvailable() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔗 Connected to database');
    
    // 1. Check current room status
    console.log('\n📊 === สถานะห้องปัจจุบัน ===');
    const [currentStatus] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM rooms 
      GROUP BY status
      ORDER BY count DESC
    `);
    
    currentStatus.forEach(row => {
      console.log(`   ${row.status}: ${row.count} ห้อง`);
    });
    
    // 2. Show rooms that are not available
    console.log('\n🔍 === ห้องที่ไม่ว่าง ===');
    const [notAvailable] = await connection.execute(`
      SELECT room_number, status, current_booking_id, floor
      FROM rooms 
      WHERE status != 'available'
      ORDER BY room_number
    `);
    
    if (notAvailable.length > 0) {
      notAvailable.forEach(room => {
        console.log(`   ห้อง ${room.room_number} (ชั้น ${room.floor}): ${room.status} - Booking ID: ${room.current_booking_id || 'ไม่มี'}`);
      });
      
      // 3. Reset all rooms to available
      console.log('\n🔄 === กำลังรีเซ็ตสถานะห้องทั้งหมดเป็นว่าง ===');
      const [result] = await connection.execute(`
        UPDATE rooms 
        SET status = 'available', 
            current_booking_id = NULL,
            updated_at = NOW()
        WHERE status != 'available'
      `);
      
      console.log(`✅ อัปเดตเสร็จสิ้น: ${result.affectedRows} ห้อง`);
      
      // 4. Verify changes
      console.log('\n📊 === สถานะห้องหลังการรีเซ็ต ===');
      const [newStatus] = await connection.execute(`
        SELECT status, COUNT(*) as count
        FROM rooms 
        GROUP BY status
        ORDER BY count DESC
      `);
      
      newStatus.forEach(row => {
        console.log(`   ${row.status}: ${row.count} ห้อง`);
      });
      
    } else {
      console.log('✅ ห้องทุกห้องว่างอยู่แล้ว');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetAllRoomsToAvailable();