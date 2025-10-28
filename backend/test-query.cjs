// Test exact query from API

const mysql = require('mysql2/promise');

async function testQuery() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today:', today);
    
    // Test orphaned rooms query (exact from API)
    console.log('\n🔍 === Testing orphaned rooms query ===');
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
    
    console.log('📊 Orphaned rooms found:', orphanedRooms.length);
    
    // Test expired bookings query (exact from API)
    console.log('\n🔍 === Testing expired bookings query ===');
    const [expiredBookings] = await connection.execute(`
      SELECT b.id, b.room_id, b.check_out_date, b.status, r.room_number, r.status as room_status
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
      WHERE b.check_out_date < ? 
      AND b.status NOT IN ('completed')
    `, [today]);
    
    console.log('📊 Expired bookings found:', expiredBookings.length);
    
    // Let's also check date formats
    console.log('\n🔍 === Checking date formats ===');
    const [checkDates] = await connection.execute(`
      SELECT check_out_date, DATE(check_out_date) as date_only, 
             check_out_date < ? as is_expired
      FROM bookings 
      WHERE check_out_date < ?
      LIMIT 5
    `, [today, today]);
    
    console.log('📅 Date comparison results:');
    checkDates.forEach(row => {
      console.log(`  Original: ${row.check_out_date}, Date only: ${row.date_only}, Is expired: ${row.is_expired}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testQuery();