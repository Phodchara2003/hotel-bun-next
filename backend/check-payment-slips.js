import mysql from 'mysql2/promise';

async function checkPaymentSlipsTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔍 Checking payment_slips table structure...');
    
    // Check if payment_slips table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'payment_slips'
    `);
    
    if (tables.length === 0) {
      console.log('❌ payment_slips table does not exist!');
      await connection.end();
      return;
    }
    
    // Get table structure
    const [columns] = await connection.execute('DESCRIBE payment_slips');
    console.log('\n📊 payment_slips table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key} ${col.Default || ''}`);
    });
    
    // Check existing data
    console.log('\n📋 Existing payment slips:');
    const [slips] = await connection.execute(`
      SELECT 
        ps.*,
        b.booking_reference,
        b.guest_name
      FROM payment_slips ps
      LEFT JOIN bookings b ON ps.booking_id = b.id
      ORDER BY ps.created_at DESC
      LIMIT 10
    `);
    
    slips.forEach((slip, index) => {
      console.log(`\n${index + 1}. Payment Slip #${slip.id}:`);
      console.log(`   - Booking: ${slip.booking_reference} (${slip.guest_name})`);
      console.log(`   - File: ${slip.file_name}`);
      console.log(`   - Path: ${slip.file_path}`);
      console.log(`   - Amount: ฿${slip.amount}`);
      console.log(`   - Status: ${slip.status}`);
      console.log(`   - Created: ${slip.created_at}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPaymentSlipsTable();