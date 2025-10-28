// Check room 503 booking status

const mysql = require('mysql2/promise');

async function checkRoom503() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔗 Connected to database');
    
    // 1. Check room 503 details
    console.log('\n🏠 === ข้อมูลห้อง 503 ===');
    const [roomDetails] = await connection.execute(`
      SELECT id, room_number, bed_type, status, floor, current_booking_id, updated_at
      FROM rooms 
      WHERE room_number = '503'
    `);
    
    if (roomDetails.length > 0) {
      const room = roomDetails[0];
      console.log(`📌 ห้อง ${room.room_number}:`);
      console.log(`   ID: ${room.id}`);
      console.log(`   ประเภทเตียง: ${room.bed_type}`);
      console.log(`   สถานะ: ${room.status}`);
      console.log(`   ชั้น: ${room.floor}`);
      console.log(`   การจองปัจจุบัน: ${room.current_booking_id || 'ไม่มี'}`);
      console.log(`   อัปเดตล่าสุด: ${room.updated_at}`);
      
      // 2. Check all bookings for room 503
      console.log('\n📋 === การจองทั้งหมดของห้อง 503 ===');
      const [allBookings] = await connection.execute(`
        SELECT b.id, b.booking_reference, b.status, b.check_in_date, b.check_out_date, 
               b.created_at, b.updated_at,
               CONCAT(u.first_name, ' ', u.last_name) as guest_name, u.email
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.room_id = ?
        ORDER BY b.created_at DESC
      `, [room.id]);
      
      if (allBookings.length > 0) {
        console.log(`📊 พบการจอง: ${allBookings.length} รายการ\n`);
        
        allBookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. ${booking.booking_reference || 'No Reference'}`);
          console.log(`      สถานะ: ${booking.status || 'ไม่ระบุ'}`);
          console.log(`      ผู้จอง: ${booking.guest_name || 'ไม่ระบุ'} (${booking.email || 'ไม่มีอีเมล'})`);
          console.log(`      เข้าพัก: ${booking.check_in_date}`);
          console.log(`      ออกพัก: ${booking.check_out_date}`);
          console.log(`      จองเมื่อ: ${booking.created_at}`);
          console.log(`      อัปเดต: ${booking.updated_at}`);
          console.log('');
        });
      } else {
        console.log('❌ ไม่พบการจองสำหรับห้องนี้');
      }
      
      // 3. Check current date bookings
      const today = new Date().toISOString().split('T')[0];
      console.log(`\n🗓️ === การจองที่ครอบคลุมวันนี้ (${today}) ===`);
      const [currentBookings] = await connection.execute(`
        SELECT b.id, b.booking_reference, b.status, b.check_in_date, b.check_out_date,
               CONCAT(u.first_name, ' ', u.last_name) as guest_name
        FROM bookings b
        LEFT JOIN users u ON b.user_id = u.id
        WHERE b.room_id = ?
        AND b.check_in_date <= ?
        AND b.check_out_date >= ?
        AND b.status NOT IN ('cancelled', 'completed')
      `, [room.id, today, today]);
      
      if (currentBookings.length > 0) {
        console.log('🔴 มีการจองที่ยังใช้งานอยู่:');
        currentBookings.forEach(booking => {
          console.log(`   - ${booking.booking_reference}: ${booking.guest_name}`);
          console.log(`     วันที่: ${booking.check_in_date} ถึง ${booking.check_out_date}`);
          console.log(`     สถานะ: ${booking.status}`);
        });
      } else {
        console.log('✅ ไม่มีการจองที่ยังใช้งานอยู่ - ห้องควรจะว่าง');
      }
      
    } else {
      console.log('❌ ไม่พบห้อง 503 ในฐานข้อมูล');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkRoom503();