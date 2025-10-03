import mysql from 'mysql2/promise';

async function addPaymentColumns() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔧 Adding payment_receipt_url and payment_status columns to bookings table...');
    
    // Add payment_receipt_url column
    try {
      await connection.execute(`
        ALTER TABLE bookings 
        ADD COLUMN payment_receipt_url VARCHAR(500) NULL AFTER special_requests
      `);
      console.log('✅ Added payment_receipt_url column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ payment_receipt_url column already exists');
      } else {
        throw error;
      }
    }
    
    // Add payment_status column
    try {
      await connection.execute(`
        ALTER TABLE bookings 
        ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' AFTER payment_receipt_url
      `);
      console.log('✅ Added payment_status column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️ payment_status column already exists');
      } else {
        throw error;
      }
    }
    
    // Show updated table structure
    console.log('\n🔍 Updated bookings table structure:');
    const [columns] = await connection.execute('DESCRIBE bookings');
    
    columns.forEach(col => {
      if (col.Field.includes('payment')) {
        console.log(`✨ ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default || ''}`);
      }
    });
    
    await connection.end();
    console.log('\n🎉 Payment columns added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addPaymentColumns();