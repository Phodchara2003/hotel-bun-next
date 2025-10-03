import mysql from 'mysql2/promise';

async function checkBookingsTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔍 Current bookings table structure:');
    const [columns] = await connection.execute('DESCRIBE bookings');
    
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key} ${col.Default || ''}`);
    });
    
    // Check if payment_receipt_url exists
    const hasPaymentReceiptUrl = columns.some(col => col.Field === 'payment_receipt_url');
    console.log(`\n📸 payment_receipt_url column exists: ${hasPaymentReceiptUrl}`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBookingsTable();