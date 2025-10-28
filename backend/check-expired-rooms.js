import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking'
};

async function checkExpiredBookingsAndRooms() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('🔗 Connected to database');
    
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);
    
    // 1. ตรวจสอบการจองที่เลยวันที่ check-out แล้ว
    console.log('\n🔍 === ตรวจสอบการจองที่เลยวันที่ check-out ===');
    const [expiredBookings] = await connection.execute(`
      SELECT 
        b.id as booking_id,
        b.booking_reference,
        b.guest_name,
        b.room_id,
        r.room_number,
        r.status as room_status,
        b.check_in_date,
        b.check_out_date,
        b.status as booking_status,
        DATEDIFF(?, b.check_out_date) as days_past_checkout
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.check_out_date < ?
      ORDER BY b.check_out_date DESC
    `, [today, today]);
    
    console.log(`📊 พบการจองที่เลยวันที่ check-out: ${expiredBookings.length} รายการ`);
    
    if (expiredBookings.length > 0) {
      console.log('\n📋 รายละเอียดการจองที่เลยวันที่:');
      expiredBookings.forEach(booking => {
        console.log(`
  📌 ID: ${booking.booking_id} | Ref: ${booking.booking_reference}
  👤 ผู้จอง: ${booking.guest_name}
  🏠 ห้อง: ${booking.room_number} (ID: ${booking.room_id})
  📅 Check-out: ${booking.check_out_date} (เลยมา ${booking.days_past_checkout} วัน)
  🔖 สถานะการจอง: ${booking.booking_status}
  🏨 สถานะห้อง: ${booking.room_status}
  ${booking.room_status !== 'available' ? '⚠️  ห้องยังไม่ว่าง!' : '✅ ห้องว่างแล้ว'}
        `);
      });
    }
    
    // 2. ตรวจสอบห้องที่ควรจะว่างแต่ยังไม่ว่าง
    console.log('\n🔍 === ห้องที่ควรจะว่างแต่ยังไม่ว่าง ===');
    const [roomsNeedUpdate] = await connection.execute(`
      SELECT 
        r.id as room_id,
        r.room_number,
        r.status as room_status,
        b.id as booking_id,
        b.booking_reference,
        b.guest_name,
        b.check_out_date,
        b.status as booking_status,
        DATEDIFF(?, b.check_out_date) as days_past_checkout
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id 
        AND b.check_out_date < ?
        AND b.status IN ('confirmed', 'checkedin')
      WHERE r.status != 'available' 
        AND b.id IS NOT NULL
      ORDER BY r.room_number
    `, [today, today]);
    
    console.log(`🏠 ห้องที่ต้องอัปเดต: ${roomsNeedUpdate.length} ห้อง`);
    
    if (roomsNeedUpdate.length > 0) {
      console.log('\n📋 รายละเอียดห้องที่ต้องอัปเดต:');
      roomsNeedUpdate.forEach(room => {
        console.log(`
  🏠 ห้อง: ${room.room_number} (ID: ${room.room_id})
  🔖 สถานะปัจจุบัน: ${room.room_status}
  📌 การจองที่เกี่ยวข้อง: ${room.booking_reference}
  👤 ผู้จอง: ${room.guest_name}
  📅 Check-out: ${room.check_out_date} (เลยมา ${room.days_past_checkout} วัน)
  🔖 สถานะการจอง: ${room.booking_status}
        `);
      });
    }
    
    // 3. ตรวจสอบสถิติห้องทั้งหมด
    console.log('\n🔍 === สถิติห้องทั้งหมด ===');
    const [roomStats] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM rooms
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('📊 สถิติสถานะห้อง:');
    roomStats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat.count} ห้อง`);
    });
    
    // 4. สรุปการจองที่ยังไม่เสร็จสิ้น
    console.log('\n🔍 === สรุปการจองที่ยังไม่เสร็จสิ้น ===');
    const [bookingStats] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM bookings
      WHERE status != 'completed' AND status != 'cancelled'
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('📊 สถิติสถานะการจอง (ที่ยังไม่เสร็จสิ้น):');
    bookingStats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat.count} รายการ`);
    });
    
    console.log('\n✅ การตรวจสอบเสร็จสิ้น');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// รันการตรวจสอบ
checkExpiredBookingsAndRooms();