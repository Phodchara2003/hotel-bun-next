// Test database query directly
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabaseQuery() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking',
      port: 3306
    });

    console.log('🔗 Connected to database');
    
    // Test the exact query from searchAvailableRooms
    const query = `
      SELECT 
        rt.id as room_type_id,
        rt.name as room_type_name,
        rt.description,
        rt.price_per_night,
        rt.max_guests,
        rt.size_sqm,
        rt.amenities,
        rt.images,
        rt.type,
        rt.bed_type,
        h.id as hotel_id,
        h.name as hotel_name,
        h.address as hotel_address,
        COUNT(DISTINCT r.id) as available_count,
        GROUP_CONCAT(DISTINCT r.room_number ORDER BY r.room_number) as room_numbers,
        GROUP_CONCAT(DISTINCT r.floor ORDER BY r.floor) as floors
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
      GROUP BY rt.id, rt.name, rt.description, rt.price_per_night, rt.max_guests, rt.size_sqm, rt.amenities, rt.images, rt.type, rt.bed_type, h.id, h.name, h.address
      HAVING available_count > 0
      ORDER BY rt.price_per_night ASC
    `;
    
    const checkinDate = '2025-10-05';
    const checkoutDate = '2025-10-07';
    const guestCount = 2;
    
    console.log('🔍 Running query with params:', { checkinDate, checkoutDate, guestCount });
    
    const [rows] = await connection.execute(query, [checkinDate, checkoutDate, guestCount]);
    
    console.log(`📊 Query returned ${rows.length} rows`);
    
    if (rows.length > 0) {
      console.log('\n📋 Column names:', Object.keys(rows[0]));
      console.log('\n🏨 First row data:');
      console.log('- room_type_id:', rows[0].room_type_id);
      console.log('- room_type_name:', rows[0].room_type_name);
      console.log('- available_count:', rows[0].available_count, typeof rows[0].available_count);
      console.log('- room_numbers:', rows[0].room_numbers);
      console.log('- amenities:', rows[0].amenities);
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testDatabaseQuery();