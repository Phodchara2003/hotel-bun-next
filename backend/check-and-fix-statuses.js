import mysql from 'mysql2/promise';

async function checkAndFixBookingStatuses() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔍 Checking booking statuses...');
    
    // Check current status values
    const [bookings] = await connection.execute(`
      SELECT id, booking_reference, status, payment_status, created_at 
      FROM bookings 
      ORDER BY created_at DESC
    `);
    
    console.log('\n📊 Current booking statuses:');
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. Booking #${booking.id} (${booking.booking_reference}):`);
      console.log(`   - Status: "${booking.status}" (type: ${typeof booking.status})`);
      console.log(`   - Payment Status: "${booking.payment_status}"`);
      console.log(`   - Created: ${booking.created_at}`);
      console.log('');
    });
    
    // Check for NULL or empty status values
    const [nullStatuses] = await connection.execute(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE status IS NULL OR status = '' OR status = 'null'
    `);
    
    console.log(`🔍 Found ${nullStatuses[0].count} bookings with NULL/empty status`);
    
    if (nullStatuses[0].count > 0) {
      console.log('\n🔧 Fixing NULL/empty status values...');
      
      // Update NULL or empty status to 'pending'
      const [updateResult] = await connection.execute(`
        UPDATE bookings 
        SET status = 'pending' 
        WHERE status IS NULL OR status = '' OR status = 'null'
      `);
      
      console.log(`✅ Updated ${updateResult.affectedRows} bookings to 'pending' status`);
    }
    
    // Check the ENUM definition for status column
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'hotel_booking' 
      AND TABLE_NAME = 'bookings' 
      AND COLUMN_NAME = 'status'
    `);
    
    console.log('\n📋 Status column definition:');
    if (columns.length > 0) {
      const col = columns[0];
      console.log(`   - Column: ${col.COLUMN_NAME}`);
      console.log(`   - Type: ${col.COLUMN_TYPE}`);
      console.log(`   - Default: ${col.COLUMN_DEFAULT}`);
      console.log(`   - Nullable: ${col.IS_NULLABLE}`);
    }
    
    // Show final results
    console.log('\n📊 Final booking statuses:');
    const [finalBookings] = await connection.execute(`
      SELECT id, booking_reference, status, payment_status 
      FROM bookings 
      ORDER BY created_at DESC
    `);
    
    finalBookings.forEach((booking, index) => {
      console.log(`${index + 1}. Booking #${booking.id}: status="${booking.status}", payment="${booking.payment_status}"`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndFixBookingStatuses();