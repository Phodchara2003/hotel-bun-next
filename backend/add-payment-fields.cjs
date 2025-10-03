const mysql = require('mysql2/promise');

async function addPaymentFields() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hotel_booking'
  });

  try {
    console.log('Adding payment fields to bookings table...');
    
    // Add payment_status column
    await connection.execute(`
      ALTER TABLE bookings 
      ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' AFTER status
    `);
    console.log('✅ Added payment_status column');
    
    // Add payment_method column
    await connection.execute(`
      ALTER TABLE bookings 
      ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL AFTER payment_status
    `);
    console.log('✅ Added payment_method column');
    
    // Add payment_date column
    await connection.execute(`
      ALTER TABLE bookings 
      ADD COLUMN payment_date DATETIME DEFAULT NULL AFTER payment_method
    `);
    console.log('✅ Added payment_date column');
    
    // Update existing confirmed bookings
    await connection.execute(`
      UPDATE bookings 
      SET payment_status = 'paid', 
          payment_date = created_at 
      WHERE status = 'confirmed'
    `);
    console.log('✅ Updated existing confirmed bookings');
    
    console.log('🎉 Payment fields added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding payment fields:', error);
  } finally {
    await connection.end();
  }
}

addPaymentFields();