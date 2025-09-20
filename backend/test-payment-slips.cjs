const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertTestPaymentSlips() {
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

    // Insert test payment slips
    const insertQuery = `
      INSERT INTO payment_slips (booking_id, file_path, amount, payment_date, status) VALUES 
      (15, 'test-payment-slip.jpg', 7600.00, '2025-09-20', 'pending'),
      (16, 'test-payment-slip-2.jpg', 548.00, '2025-09-20', 'verified'),
      (17, 'test-payment-slip-3.jpg', 898.00, '2025-09-21', 'unspecified')
      ON DUPLICATE KEY UPDATE amount = VALUES(amount);
    `;

    const [result] = await connection.execute(insertQuery);
    console.log('✅ Test payment slips inserted successfully:', result.affectedRows, 'rows affected');

    // Verify the data
    const [rows] = await connection.execute('SELECT * FROM payment_slips ORDER BY id DESC LIMIT 10');
    console.log('📋 Payment slips in database:');
    rows.forEach(row => {
      console.log(`  ID: ${row.id}, Booking: ${row.booking_id}, File: ${row.file_path}, Amount: ${row.amount}, Status: ${row.status}`);
    });

    await connection.end();
    console.log('🔚 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertTestPaymentSlips();