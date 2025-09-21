const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixPaymentSlipConnections() {
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

    // Get existing bookings and payment slips
    const [bookings] = await connection.execute('SELECT id, total_price, guest_name FROM bookings ORDER BY id DESC LIMIT 5');
    const [slips] = await connection.execute('SELECT id, amount, file_path FROM payment_slips WHERE booking_id IS NULL ORDER BY id DESC LIMIT 5');

    console.log('\n📋 Available Bookings:');
    bookings.forEach(booking => {
      console.log(`  Booking ${booking.id}: ${booking.guest_name} - ${booking.total_price}`);
    });

    console.log('\n💳 Unlinked Payment Slips:');
    slips.forEach(slip => {
      console.log(`  Slip ${slip.id}: ${slip.file_path} - ${slip.amount}`);
    });

    // Fix the connections based on amount matching
    const fixes = [
      { slipId: 4, bookingId: 15, amount: 7600.00 }, // test-payment-slip.jpg
      { slipId: 5, bookingId: 16, amount: 548.00 },  // test-payment-slip-2.jpg  
      { slipId: 6, bookingId: 17, amount: 898.00 }   // test-payment-slip-3.jpg
    ];

    console.log('\n🔧 Applying fixes:');
    for (const fix of fixes) {
      try {
        const [result] = await connection.execute(
          'UPDATE payment_slips SET booking_id = ? WHERE id = ?',
          [fix.bookingId, fix.slipId]
        );
        console.log(`  ✅ Fixed slip ${fix.slipId} → booking ${fix.bookingId} (${fix.amount})`);
      } catch (error) {
        console.log(`  ❌ Failed to fix slip ${fix.slipId}: ${error.message}`);
      }
    }

    // Verify the fixes
    console.log('\n🔍 Verification:');
    const [verifyResults] = await connection.execute(`
      SELECT 
        b.id as booking_id,
        b.guest_name,
        b.total_price,
        ps.id as slip_id,
        ps.file_path,
        ps.amount as slip_amount
      FROM bookings b
      LEFT JOIN payment_slips ps ON b.id = ps.booking_id
      WHERE b.id IN (15, 16, 17, 18)
      ORDER BY b.id DESC
    `);

    verifyResults.forEach(row => {
      if (row.slip_id) {
        console.log(`  ✅ Booking ${row.booking_id}: ${row.guest_name} (${row.total_price}) → Slip ${row.slip_id} (${row.slip_amount})`);
      } else {
        console.log(`  ⚠️  Booking ${row.booking_id}: ${row.guest_name} (${row.total_price}) → No slip`);
      }
    });

    await connection.end();
    console.log('\n🔚 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPaymentSlipConnections();