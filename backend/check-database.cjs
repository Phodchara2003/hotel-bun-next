const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '12345678',
      database: 'hotel_booking',
      multipleStatements: true
    });

    console.log('✅ Connected to database successfully');

    // ตรวจสอบโครงสร้างตาราง room_types
    console.log('\n📋 ROOM_TYPES Table Structure:');
    const [roomTypesStructure] = await connection.execute('DESCRIBE room_types');
    console.table(roomTypesStructure);

    // ตรวจสอบข้อมูลในตาราง room_types
    console.log('\n📊 ROOM_TYPES Data:');
    const [roomTypesData] = await connection.execute('SELECT id, name, bed_type, max_guests, price_per_night FROM room_types LIMIT 5');
    console.table(roomTypesData);

    // ตรวจสอบโครงสร้างตาราง rooms
    console.log('\n📋 ROOMS Table Structure:');
    const [roomsStructure] = await connection.execute('DESCRIBE rooms');
    console.table(roomsStructure);

    // ตรวจสอบข้อมูลในตาราง rooms
    console.log('\n📊 ROOMS Data:');
    const [roomsData] = await connection.execute('SELECT id, room_number, room_type_id, floor, status FROM rooms LIMIT 10');
    console.table(roomsData);

    // ตรวจสอบโครงสร้างตาราง bookings
    console.log('\n📋 BOOKINGS Table Structure:');
    const [bookingsStructure] = await connection.execute('DESCRIBE bookings');
    console.table(bookingsStructure);

    // ตรวจสอบข้อมูลในตาราง bookings
    console.log('\n📊 BOOKINGS Data:');
    const [bookingsData] = await connection.execute('SELECT id, room_id, check_in_date, check_out_date, status FROM bookings LIMIT 5');
    console.table(bookingsData);

    // ทดสอบการค้นหาห้องว่าง
    console.log('\n🔍 Testing Room Search Query:');
    const testCheckin = '2025-01-15';
    const testCheckout = '2025-01-16';
    const testGuests = 1;
    
    const searchQuery = `
      SELECT 
        rt.id as room_type_id,
        rt.name as room_type_name,
        rt.description,
        rt.price_per_night,
        rt.max_guests,
        rt.bed_type,
        COUNT(DISTINCT r.id) as available_count,
        GROUP_CONCAT(DISTINCT r.room_number ORDER BY r.room_number) as room_numbers
      FROM room_types rt
      LEFT JOIN rooms r ON rt.id = r.room_type_id AND r.status = 'available'
      LEFT JOIN bookings b ON r.id = b.room_id 
        AND b.status IN ('confirmed', 'checked_in') 
        AND NOT (
          ? >= b.check_out_date OR ? <= b.check_in_date
        )
      WHERE rt.max_guests >= ? 
        AND b.id IS NULL
      GROUP BY rt.id, rt.name, rt.description, rt.price_per_night, rt.max_guests, rt.bed_type
      HAVING available_count > 0
      ORDER BY rt.price_per_night ASC
    `;
    
    const [searchResults] = await connection.execute(searchQuery, [testCheckin, testCheckout, testGuests]);
    console.log(`\n📋 Search Results for ${testCheckin} to ${testCheckout} (${testGuests} guests):`);
    console.table(searchResults);

    await connection.end();
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  }
}

checkDatabase();