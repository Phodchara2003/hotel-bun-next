const mysql = require('mysql2/promise');

async function checkAllPaymentSlips() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });

    const [slips] = await connection.execute(
      'SELECT id, booking_id, user_id, original_name, amount, status, created_at FROM payment_slips ORDER BY created_at DESC LIMIT 10'
    );
    
    console.log('📋 Recent Payment Slips:');
    slips.forEach(slip => {
      console.log(`ID: ${slip.id}, Booking: ${slip.booking_id}, User: ${slip.user_id}, File: ${slip.original_name}, Amount: ${slip.amount} THB, Status: ${slip.status}`);
    });

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllPaymentSlips();