const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRecentData() {
  try {
    console.log('🔄 Connecting to MySQL database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'hotel_booking',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL database successfully!');

    // Check recent bookings
    console.log('\n📋 Recent Bookings (Latest 5):');
    const [bookings] = await connection.execute(`
      SELECT id, guest_name, booking_reference, total_price, status, created_at
      FROM bookings 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    bookings.forEach(row => {
      console.log(`  Booking ${row.id}: ${row.guest_name} (${row.booking_reference}) - ${row.total_price} - ${row.status}`);
      console.log(`    Created: ${row.created_at}`);
    });

    // Check recent payment slips
    console.log('\n💳 Recent Payment Slips (Latest 10):');
    const [slips] = await connection.execute(`
      SELECT id, booking_id, file_path, amount, status, created_at
      FROM payment_slips 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    if (slips.length === 0) {
      console.log('  ❌ No payment slips found in database!');
    } else {
      slips.forEach(row => {
        console.log(`  Slip ${row.id}: Booking ${row.booking_id || 'NULL'} - ${row.file_path}`);
        console.log(`    Amount: ${row.amount}, Status: ${row.status}, Created: ${row.created_at}`);
      });
    }

    // Check if there are any relationships
    console.log('\n🔗 Booking-Payment Slip Relationships:');
    const [relationships] = await connection.execute(`
      SELECT 
        b.id as booking_id,
        b.guest_name,
        b.booking_reference,
        COUNT(ps.id) as slip_count
      FROM bookings b
      LEFT JOIN payment_slips ps ON b.id = ps.booking_id
      GROUP BY b.id, b.guest_name, b.booking_reference
      ORDER BY b.created_at DESC
      LIMIT 10
    `);
    
    relationships.forEach(row => {
      console.log(`  Booking ${row.booking_id} (${row.booking_reference}): ${row.guest_name} - ${row.slip_count} slips`);
    });

    await connection.end();
    console.log('\n🔚 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkRecentData();