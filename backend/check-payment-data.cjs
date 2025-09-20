const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPaymentSlipData() {
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

    // Check table structure
    const [columns] = await connection.execute('DESCRIBE payment_slips');
    console.log('📋 Payment slips table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'nullable' : 'not null'}) - Default: ${col.Default}`);
    });

    // Check current data
    const [rows] = await connection.execute(`
      SELECT id, booking_id, file_path, amount, status, payment_date 
      FROM payment_slips 
      WHERE booking_id IN (15, 16, 17) 
      ORDER BY booking_id DESC
    `);
    
    console.log('\n📊 Current payment slips data:');
    rows.forEach(row => {
      console.log(`  ID: ${row.id}, Booking: ${row.booking_id}, File: ${row.file_path}`);
      console.log(`    Amount: ${row.amount}, Status: '${row.status}', Date: ${row.payment_date}`);
    });

    await connection.end();
    console.log('\n🔚 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkPaymentSlipData();