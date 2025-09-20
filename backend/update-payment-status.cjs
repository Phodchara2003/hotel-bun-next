const mysql = require('mysql2/promise');
require('dotenv').config();

async function updatePaymentSlipStatus() {
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

    // Update payment slip statuses
    const updateQuery = `
      UPDATE payment_slips SET status = 'unspecified' WHERE id = 6;
      UPDATE payment_slips SET status = 'verified' WHERE id = 5;
      UPDATE payment_slips SET status = 'pending' WHERE id = 4;
    `;

    // Split queries and execute them one by one
    const queries = updateQuery.split(';').filter(q => q.trim().length > 0);
    
    for (const query of queries) {
      const [result] = await connection.execute(query.trim());
      console.log('✅ Updated payment slip status, affected rows:', result.affectedRows);
    }

    // Verify the data
    const [rows] = await connection.execute('SELECT id, booking_id, file_path, amount, status FROM payment_slips ORDER BY id DESC LIMIT 10');
    console.log('📋 Updated payment slips:');
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

updatePaymentSlipStatus();