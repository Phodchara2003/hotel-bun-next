const mysql = require('mysql2/promise');
require('dotenv').config();

async function recreateTestData() {
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

    // Create a test booking
    console.log('📋 Creating test booking...');
    const [bookingResult] = await connection.execute(`
      INSERT INTO bookings 
      (user_id, hotel_id, room_type_id, check_in_date, check_out_date, guests, total_price, status, booking_reference, guest_name, guest_phone, guest_email, special_requests) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      10,                                    // user_id
      2,                                     // hotel_id  
      8,                                     // room_type_id
      '2025-09-22',                          // check_in_date
      '2025-09-23',                          // check_out_date
      1,                                     // guests
      548.00,                                // total_price
      'pending',                             // status
      'BK' + Math.floor(Math.random() * 100000), // booking_reference
      'Phodchara Meeha',                     // guest_name
      '0610931494',                          // guest_phone
      'mmoorrttff7232208@gmail.com',         // guest_email
      'ห้องวิวสวย เตียงใหญ่'                 // special_requests  
    ]);

    const bookingId = bookingResult.insertId;
    console.log(`✅ Created booking with ID: ${bookingId}`);

    // Create test payment slips for this booking
    console.log('💳 Creating test payment slips...');
    const slips = [
      {
        file_name: 'payment-slip-1.jpg',
        file_path: 'payment-slip-1.jpg',
        amount: 548.00,
        status: 'approved'
      },
      {
        file_name: 'payment-slip-2.jpg', 
        file_path: 'payment-slip-2.jpg',
        amount: 100.00,
        status: 'pending'
      }
    ];

    for (const [index, slip] of slips.entries()) {
      const [slipResult] = await connection.execute(`
        INSERT INTO payment_slips 
        (booking_id, user_id, file_name, original_name, file_path, amount, payment_date, status) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        bookingId,                        // booking_id
        10,                               // user_id
        slip.file_name,                   // file_name
        slip.file_name,                   // original_name
        slip.file_path,                   // file_path
        slip.amount,                      // amount
        slip.status                       // status
      ]);
      
      console.log(`✅ Created payment slip ${index + 1} with ID: ${slipResult.insertId}`);
    }

    // Verify the data
    console.log('\n🔍 Verification:');
    const [verifyResults] = await connection.execute(`
      SELECT 
        b.id as booking_id,
        b.guest_name,
        b.booking_reference,
        b.total_price,
        COUNT(ps.id) as slip_count,
        GROUP_CONCAT(ps.file_path) as slip_files,
        GROUP_CONCAT(ps.status) as slip_statuses
      FROM bookings b
      LEFT JOIN payment_slips ps ON b.id = ps.booking_id
      WHERE b.id = ?
      GROUP BY b.id
    `, [bookingId]);

    verifyResults.forEach(row => {
      console.log(`📋 Booking ${row.booking_id}: ${row.guest_name} (${row.booking_reference})`);
      console.log(`    Total: ${row.total_price}, Slips: ${row.slip_count}`);
      console.log(`    Files: ${row.slip_files}`);
      console.log(`    Statuses: ${row.slip_statuses}`);
    });

    await connection.end();
    console.log('\n🔚 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

recreateTestData();