import mysql from 'mysql2/promise';

async function testBookingsData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔍 Testing bookings data from database...');
    
    // Get all bookings
    const [allBookings] = await connection.execute(`
      SELECT 
        b.id,
        b.user_id,
        b.hotel_id,
        b.room_type_id,
        b.check_in_date,
        b.check_out_date,
        b.guests,
        b.total_price,
        b.status,
        b.booking_reference,
        b.guest_name,
        b.guest_phone,
        b.guest_email,
        b.special_requests,
        b.payment_receipt_url,
        b.payment_status,
        b.created_at,
        h.name as hotel_name,
        h.address as hotel_address,
        rt.name as room_type_name,
        rt.price_per_night as room_price
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);
    
    console.log(`\n📊 Found ${allBookings.length} bookings in database:`);
    
    allBookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking #${booking.id}:`);
      console.log(`   - User ID: ${booking.user_id}`);
      console.log(`   - Reference: ${booking.booking_reference}`);
      console.log(`   - Guest: ${booking.guest_name}`);
      console.log(`   - Hotel: ${booking.hotel_name || 'Unknown'}`);
      console.log(`   - Room Type: ${booking.room_type_name || 'Unknown'}`);
      console.log(`   - Check-in: ${booking.check_in_date}`);
      console.log(`   - Check-out: ${booking.check_out_date}`);
      console.log(`   - Total: ฿${booking.total_price}`);
      console.log(`   - Status: ${booking.status}`);
      console.log(`   - Payment Status: ${booking.payment_status || 'pending'}`);
      console.log(`   - Created: ${booking.created_at}`);
    });
    
    // Get users to see which user IDs exist
    console.log('\n👥 Users in database:');
    const [users] = await connection.execute('SELECT id, email, name FROM users ORDER BY id');
    users.forEach(user => {
      console.log(`   - User ID ${user.id}: ${user.email} (${user.name})`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBookingsData();