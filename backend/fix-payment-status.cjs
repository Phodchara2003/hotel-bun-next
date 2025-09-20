const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixPaymentSlipStatus() {
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

    // Update payment slip statuses with valid ENUM values
    const updates = [
      { id: 6, status: 'pending' },      // was trying to set 'unspecified'
      { id: 5, status: 'approved' },     // was trying to set 'verified'
      { id: 4, status: 'pending' }       // already correct
    ];

    for (const update of updates) {
      const [result] = await connection.execute(
        'UPDATE payment_slips SET status = ? WHERE id = ?', 
        [update.status, update.id]
      );
      console.log(`✅ Updated payment slip ID ${update.id} to status '${update.status}', affected rows: ${result.affectedRows}`);
    }

    // Verify the data
    const [rows] = await connection.execute(`
      SELECT id, booking_id, file_path, amount, status, payment_date 
      FROM payment_slips 
      WHERE booking_id IN (15, 16, 17) 
      ORDER BY booking_id DESC
    `);
    
    console.log('\n📊 Updated payment slips data:');
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

fixPaymentSlipStatus();