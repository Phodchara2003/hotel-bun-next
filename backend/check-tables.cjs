const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTableStructures() {
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

    // Check bookings table structure
    console.log('\n📋 BOOKINGS Table Structure:');
    const [bookingsColumns] = await connection.execute('DESCRIBE bookings');
    bookingsColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} - Default: ${col.Default || 'NULL'}`);
    });

    // Check payment_slips table structure
    console.log('\n💰 PAYMENT_SLIPS Table Structure:');
    const [paymentColumns] = await connection.execute('DESCRIBE payment_slips');
    paymentColumns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'} - Default: ${col.Default || 'NULL'}`);
    });

    // Check the relationship between tables
    console.log('\n🔗 Checking relationship between tables:');
    const [relationshipTest] = await connection.execute(`
      SELECT 
        b.id as booking_id,
        b.guest_name,
        COUNT(ps.id) as payment_slip_count,
        GROUP_CONCAT(ps.file_path) as slip_files
      FROM bookings b
      LEFT JOIN payment_slips ps ON b.id = ps.booking_id
      GROUP BY b.id, b.guest_name
      HAVING payment_slip_count > 0
      LIMIT 5
    `);

    relationshipTest.forEach(row => {
      console.log(`  Booking ${row.booking_id} (${row.guest_name}): ${row.payment_slip_count} slips`);
      console.log(`    Files: ${row.slip_files}`);
    });

    // Show current data in both tables
    console.log('\n📊 Current data in BOOKINGS (latest 5):');
    const [bookingsData] = await connection.execute('SELECT id, guest_name, total_price, status, created_at FROM bookings ORDER BY created_at DESC LIMIT 5');
    bookingsData.forEach(row => {
      console.log(`  ID: ${row.id}, Guest: ${row.guest_name}, Amount: ${row.total_price}, Status: ${row.status}`);
    });

    console.log('\n💳 Current data in PAYMENT_SLIPS:');
    const [slipsData] = await connection.execute('SELECT id, booking_id, file_path, amount, status FROM payment_slips ORDER BY id DESC LIMIT 10');
    slipsData.forEach(row => {
      console.log(`  ID: ${row.id}, Booking: ${row.booking_id || 'NULL'}, File: ${row.file_path}, Amount: ${row.amount}, Status: ${row.status}`);
    });

    await connection.end();
    console.log('\n🔚 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTableStructures();