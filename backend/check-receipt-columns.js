import mysql from 'mysql2/promise';

async function checkPaymentReceiptColumns() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔍 Checking payment receipt related columns...');
    
    // Check current bookings table structure
    const [columns] = await connection.execute('DESCRIBE bookings');
    console.log('\n📊 Current bookings table columns:');
    
    const paymentColumns = [];
    columns.forEach(col => {
      if (col.Field.includes('payment') || col.Field.includes('receipt')) {
        paymentColumns.push(col);
        console.log(`✅ ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default || ''}`);
      }
    });
    
    console.log(`\n📋 Found ${paymentColumns.length} payment-related columns`);
    
    // Check if we need additional columns for receipt metadata
    const needsColumns = [];
    
    // Check for receipt upload timestamp
    if (!paymentColumns.some(col => col.Field === 'receipt_uploaded_at')) {
      needsColumns.push('receipt_uploaded_at TIMESTAMP NULL');
    }
    
    // Check for receipt original filename
    if (!paymentColumns.some(col => col.Field === 'receipt_filename')) {
      needsColumns.push('receipt_filename VARCHAR(255) NULL');
    }
    
    // Check for receipt file size
    if (!paymentColumns.some(col => col.Field === 'receipt_file_size')) {
      needsColumns.push('receipt_file_size INT NULL');
    }
    
    console.log(`\n🔧 Columns to add: ${needsColumns.length}`);
    
    if (needsColumns.length > 0) {
      console.log('\n➕ Adding missing columns...');
      
      for (const column of needsColumns) {
        try {
          await connection.execute(`ALTER TABLE bookings ADD COLUMN ${column}`);
          console.log(`✅ Added: ${column}`);
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`⚠️ Column already exists: ${column}`);
          } else {
            console.error(`❌ Error adding ${column}:`, error.message);
          }
        }
      }
    }
    
    // Show final structure
    console.log('\n📊 Final payment-related columns:');
    const [finalColumns] = await connection.execute('DESCRIBE bookings');
    finalColumns.forEach(col => {
      if (col.Field.includes('payment') || col.Field.includes('receipt')) {
        console.log(`✨ ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default || ''}`);
      }
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPaymentReceiptColumns();