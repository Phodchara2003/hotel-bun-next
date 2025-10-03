import mysql from 'mysql2/promise';

async function fixBookingsAndCheckUsers() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔧 Fixing bookings status and checking users...');
    
    // Fix empty status values - set default to 'pending'
    console.log('\n📝 Fixing empty status values...');
    const [statusResult] = await connection.execute(`
      UPDATE bookings 
      SET status = 'pending' 
      WHERE status IS NULL OR status = ''
    `);
    console.log(`✅ Updated ${statusResult.affectedRows} bookings with default status`);
    
    // Check users table structure first
    console.log('\n🔍 Checking users table structure...');
    const [userColumns] = await connection.execute('DESCRIBE users');
    console.log('Users table columns:');
    userColumns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });
    
    // Get users with available columns
    console.log('\n👥 Users in database:');
    const [users] = await connection.execute('SELECT id, email FROM users ORDER BY id');
    users.forEach(user => {
      console.log(`   - User ID ${user.id}: ${user.email}`);
    });
    
    // Show updated bookings
    console.log('\n📊 Updated bookings data:');
    const [bookings] = await connection.execute(`
      SELECT 
        b.id,
        b.user_id,
        b.booking_reference,
        b.guest_name,
        b.status,
        b.payment_status,
        b.total_price,
        b.created_at,
        h.name as hotel_name,
        rt.name as room_type_name
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);
    
    bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking #${booking.id}:`);
      console.log(`   - Reference: ${booking.booking_reference}`);
      console.log(`   - Guest: ${booking.guest_name}`);
      console.log(`   - Status: ${booking.status}`);
      console.log(`   - Payment: ${booking.payment_status}`);
      console.log(`   - Total: ฿${booking.total_price}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixBookingsAndCheckUsers();