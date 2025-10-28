// Debug script for auto-update functionality

const mysql = require('mysql2/promise');

async function debugAutoUpdate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    console.log('🔗 Connected to database');
    
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today (API format):', today);
    
    // Check orphaned rooms
    console.log('\n🔍 === Checking orphaned reserved rooms ===');
    const [orphanedRooms] = await connection.execute(`
      SELECT r.id, r.room_number, r.status,
             (SELECT COUNT(*) FROM bookings b 
              WHERE b.room_id = r.id 
              AND b.status IN ('confirmed', 'checkedin', 'pending') 
              AND b.check_out_date >= ?) as active_bookings
      FROM rooms r
      WHERE r.status = 'reserved'
      HAVING active_bookings = 0
    `, [today]);
    
    console.log('🏠 Orphaned reserved rooms:', orphanedRooms.length);
    orphanedRooms.forEach(room => {
      console.log(`  Room ${room.room_number} (ID: ${room.id}) - Status: ${room.status} - Active bookings: ${room.active_bookings}`);
    });
    
    // Check expired bookings
    console.log('\n🔍 === Checking expired bookings ===');
    const [expiredBookings] = await connection.execute(`
      SELECT b.id, b.room_id, b.check_out_date, b.status, r.room_number, r.status as room_status
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.check_out_date < ? 
      AND b.status NOT IN ('completed')
    `, [today]);
    
    console.log('📅 Expired bookings:', expiredBookings.length);
    expiredBookings.forEach(booking => {
      console.log(`  Booking ${booking.id} - Room ${booking.room_number} - Checkout: ${booking.check_out_date} - Booking Status: ${booking.status} - Room Status: ${booking.room_status}`);
    });
    
    // Check all reserved rooms
    console.log('\n🔍 === All reserved rooms ===');
    const [reservedRooms] = await connection.execute(`
      SELECT r.id, r.room_number, r.status
      FROM rooms r
      WHERE r.status = 'reserved'
    `);
    
    console.log('🏠 All reserved rooms:', reservedRooms.length);
    reservedRooms.forEach(room => {
      console.log(`  Room ${room.room_number} (ID: ${room.id}) - Status: ${room.status}`);
    });
    
    // Check bookings for each reserved room
    for (const room of reservedRooms) {
      const [roomBookings] = await connection.execute(`
        SELECT id, status, check_in_date, check_out_date
        FROM bookings
        WHERE room_id = ?
        ORDER BY check_out_date DESC
        LIMIT 3
      `, [room.id]);
      
      console.log(`    📋 Recent bookings for room ${room.room_number}:`);
      roomBookings.forEach(booking => {
        console.log(`      Booking ${booking.id} - Status: ${booking.status} - Checkout: ${booking.check_out_date}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugAutoUpdate();