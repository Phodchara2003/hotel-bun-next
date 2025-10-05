// ตรวจสอบข้อมูลในฐานข้อมูลโดยละเอียด
require('dotenv').config();
const mysql = require('mysql2/promise');

async function analyzeRoomAvailability() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking',
      port: 3306
    });

    console.log('🔗 Connected to database');
    
    // 1. ตรวจสอบจำนวนห้องทั้งหมด
    console.log('\n=== 📊 Room Statistics ===');
    const [totalRooms] = await connection.execute('SELECT COUNT(*) as total FROM rooms');
    console.log('Total rooms in database:', totalRooms[0].total);
    
    // 2. ตรวจสอบ status ของห้อง
    const [roomsByStatus] = await connection.execute(`
      SELECT status, COUNT(*) as count 
      FROM rooms 
      GROUP BY status
    `);
    console.log('\nRooms by status:');
    roomsByStatus.forEach(row => {
      console.log(`- ${row.status}: ${row.count} rooms`);
    });
    
    // 3. ตรวจสอบ room_types
    const [roomTypes] = await connection.execute(`
      SELECT rt.id, rt.name, rt.max_guests, COUNT(r.id) as room_count
      FROM room_types rt
      LEFT JOIN rooms r ON rt.id = r.room_type_id
      GROUP BY rt.id, rt.name, rt.max_guests
      ORDER BY rt.id
    `);
    console.log('\n=== 🏨 Room Types ===');
    roomTypes.forEach(type => {
      console.log(`${type.id}. ${type.name} (max ${type.max_guests} guests) - ${type.room_count} rooms`);
    });
    
    // 4. ตรวจสอบ bookings ที่อาจทับซ้อน
    const checkinDate = '2025-10-05';
    const checkoutDate = '2025-10-07';
    
    console.log(`\n=== 📅 Bookings for ${checkinDate} to ${checkoutDate} ===`);
    const [conflictingBookings] = await connection.execute(`
      SELECT 
        b.id,
        b.room_id,
        r.room_number,
        rt.name as room_type_name,
        b.check_in_date,
        b.check_out_date,
        b.status
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE b.status IN ('confirmed', 'checked_in') 
        AND NOT (? >= b.check_out_date OR ? <= b.check_in_date)
      ORDER BY b.check_in_date
    `, [checkinDate, checkoutDate]);
    
    console.log(`Found ${conflictingBookings.length} conflicting bookings:`);
    conflictingBookings.forEach(booking => {
      console.log(`- Room ${booking.room_number} (${booking.room_type_name}): ${booking.check_in_date} to ${booking.check_out_date} [${booking.status}]`);
    });
    
    // 5. ทดสอบ query ที่ใช้ใน searchAvailableRooms
    console.log('\n=== 🔍 Testing Search Query ===');
    const [searchResults] = await connection.execute(`
      SELECT 
        rt.id as room_type_id,
        rt.name as room_type_name,
        rt.max_guests,
        COUNT(DISTINCT r.id) as available_count,
        GROUP_CONCAT(DISTINCT r.room_number ORDER BY r.room_number) as room_numbers
      FROM room_types rt
      LEFT JOIN hotels h ON rt.hotel_id = h.id
      LEFT JOIN rooms r ON rt.id = r.room_type_id AND r.status = 'available'
      LEFT JOIN bookings b ON r.id = b.room_id 
        AND b.status IN ('confirmed', 'checked_in') 
        AND NOT (
          ? >= b.check_out_date OR ? <= b.check_in_date
        )
      WHERE rt.max_guests >= ? 
        AND b.id IS NULL
      GROUP BY rt.id, rt.name, rt.max_guests
      HAVING available_count > 0
      ORDER BY rt.name
    `, [checkinDate, checkoutDate, 2]);
    
    console.log(`Search query found ${searchResults.length} available room types:`);
    searchResults.forEach(result => {
      console.log(`- ${result.room_type_name}: ${result.available_count} rooms available`);
      console.log(`  Room numbers: ${result.room_numbers}`);
    });
    
    // 6. ตรวจสอบ rooms ที่ status ไม่ใช่ 'available'
    console.log('\n=== ❌ Unavailable Rooms ===');
    const [unavailableRooms] = await connection.execute(`
      SELECT r.room_number, r.status, rt.name as room_type_name
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.status != 'available'
      ORDER BY r.room_number
    `);
    
    console.log(`Found ${unavailableRooms.length} unavailable rooms:`);
    unavailableRooms.forEach(room => {
      console.log(`- Room ${room.room_number} (${room.room_type_name}): ${room.status}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

analyzeRoomAvailability();