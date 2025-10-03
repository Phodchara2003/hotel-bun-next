const mysql = require('mysql2/promise');

async function fixReceiptUrlColumn() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔗 Connected to database');
    
    // First show current column definition
    const [currentDef] = await connection.execute(`
      DESCRIBE bookings payment_receipt_url
    `);
    
    console.log('\n📋 Current Column Definition:');
    console.log(currentDef[0]);
    
    // Alter the column to LONGTEXT to support large base64 data
    console.log('\n🔧 Altering column to LONGTEXT...');
    await connection.execute(`
      ALTER TABLE bookings 
      MODIFY COLUMN payment_receipt_url LONGTEXT
    `);
    
    console.log('✅ Column altered successfully!');
    
    // Show new column definition
    const [newDef] = await connection.execute(`
      DESCRIBE bookings payment_receipt_url
    `);
    
    console.log('\n📋 New Column Definition:');
    console.log(newDef[0]);
    
    // Check if existing data is still there (truncated)
    const [rows] = await connection.execute(`
      SELECT 
        id,
        guest_name,
        payment_receipt_url,
        LENGTH(payment_receipt_url) as url_length
      FROM bookings 
      WHERE payment_receipt_url IS NOT NULL 
      ORDER BY receipt_uploaded_at DESC 
      LIMIT 3
    `);
    
    console.log(`\n📊 Existing data after column change:`);
    rows.forEach((row, index) => {
      console.log(`\n--- Row ${index + 1} ---`);
      console.log(`ID: ${row.id}`);
      console.log(`Guest: ${row.guest_name}`);
      console.log(`URL Length: ${row.url_length} characters`);
      console.log(`URL Preview: ${row.payment_receipt_url.substring(0, 100)}...`);
    });
    
    console.log('\n⚠️ Note: Existing truncated data cannot be recovered.');
    console.log('   Users will need to re-upload their payment receipts.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔐 Database connection closed');
    }
  }
}

fixReceiptUrlColumn();