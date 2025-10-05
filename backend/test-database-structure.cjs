const mysql = require('mysql2/promise');

// การตั้งค่าการเชื่อมต่อฐานข้อมูล
const dbConfig = {
  host: 'localhost',
  user: 'root', 
  password: '12345678',
  database: 'hotel_booking',
  charset: 'utf8mb4'
};

async function checkDatabaseStructure() {
  let connection;
  
  try {
    console.log('🔍 กำลังตรวจสอบโครงสร้างฐานข้อมูล...\n');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ\n');

    // ตรวจสอบตาราง room_types
    console.log('📋 ตาราง room_types:');
    const [roomTypes] = await connection.execute('SELECT * FROM room_types LIMIT 3');
    console.log(`   จำนวนข้อมูล: ${roomTypes.length} รายการ`);
    if (roomTypes.length > 0) {
      console.log('   ตัวอย่างข้อมูล:', {
        id: roomTypes[0].id,
        name: roomTypes[0].name,
        bed_type: roomTypes[0].bed_type,
        price: roomTypes[0].price_per_night,
        max_guests: roomTypes[0].max_guests
      });
    }
    console.log('');

    // ตรวจสอบตาราง rooms
    console.log('🏨 ตาราง rooms:');
    const [rooms] = await connection.execute('SELECT * FROM rooms LIMIT 3');
    console.log(`   จำนวนข้อมูล: ${rooms.length} รายการ`);
    if (rooms.length > 0) {
      console.log('   ตัวอย่างข้อมูล:', {
        id: rooms[0].id,
        room_number: rooms[0].room_number,
        room_type_id: rooms[0].room_type_id,
        status: rooms[0].status,
        floor: rooms[0].floor
      });
    }
    console.log('');

    // ตรวจสอบตาราง bookings
    console.log('📅 ตาราง bookings:');
    const [bookings] = await connection.execute('SELECT * FROM bookings LIMIT 3');
    console.log(`   จำนวนข้อมูล: ${bookings.length} รายการ`);
    if (bookings.length > 0) {
      console.log('   ตัวอย่างข้อมูล:', {
        id: bookings[0].id,
        room_id: bookings[0].room_id,
        check_in_date: bookings[0].check_in_date,
        check_out_date: bookings[0].check_out_date,
        status: bookings[0].status,
        guest_count: bookings[0].guest_count
      });
    }
    console.log('');

    // ตรวจสอบความสัมพันธ์ระหว่างตาราง
    console.log('🔗 ความสัมพันธ์ระหว่างตาราง:');
    const [joinResult] = await connection.execute(`
      SELECT 
        rt.id as room_type_id,
        rt.name as room_type_name,
        rt.bed_type,
        COUNT(r.id) as total_rooms,
        COUNT(CASE WHEN r.status = 'available' THEN 1 END) as available_rooms,
        COUNT(b.id) as total_bookings
      FROM room_types rt
      LEFT JOIN rooms r ON rt.id = r.room_type_id
      LEFT JOIN bookings b ON r.id = b.room_id
      GROUP BY rt.id, rt.name, rt.bed_type
      ORDER BY rt.id
    `);
    
    console.log('   สรุปข้อมูลแต่ละประเภทห้อง:');
    joinResult.forEach(row => {
      console.log(`   - ${row.room_type_name} (${row.bed_type}): ${row.available_rooms}/${row.total_rooms} ห้องว่าง, ${row.total_bookings} การจอง`);
    });
    console.log('');

    // ตรวจสอบข้อมูลประเภทเตียง
    console.log('🛏️ ประเภทเตียงที่มีในระบบ:');
    const [bedTypes] = await connection.execute('SELECT DISTINCT bed_type FROM room_types WHERE bed_type IS NOT NULL');
    bedTypes.forEach(row => {
      console.log(`   - ${row.bed_type}`);
    });
    console.log('');

    // ตรวจสอบการจองที่ active
    console.log('📊 การจองที่ active:');
    const [activeBookings] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM bookings 
      WHERE status IN ('confirmed', 'checked_in', 'pending')
      GROUP BY status
    `);
    activeBookings.forEach(row => {
      console.log(`   - ${row.status}: ${row.count} รายการ`);
    });

    console.log('\n✅ ตรวจสอบโครงสร้างฐานข้อมูลเสร็จสิ้น');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
    }
  }
}

checkDatabaseStructure();