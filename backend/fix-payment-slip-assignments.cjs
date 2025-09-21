const mysql = require('mysql2/promise');

async function fixPaymentSlipAssignments() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔌 Connected to database');
    
    // ขั้นตอนที่ 1: รีเซ็ต booking_id ทั้งหมดให้เป็น null
    console.log('🔄 Resetting all payment slip assignments...');
    await connection.execute('UPDATE payment_slips SET booking_id = NULL');
    
    // ขั้นตอนที่ 2: ดึงการจองทั้งหมดที่ยังไม่มี payment slip
    const [bookings] = await connection.execute(`
      SELECT id, user_id, total_price, created_at, guest_name
      FROM bookings 
      WHERE status IN ('pending', 'confirmed', 'completed')
      ORDER BY created_at DESC
    `);
    
    console.log(`📋 Found ${bookings.length} bookings to process`);
    
    for (const booking of bookings) {
      console.log(`\n🔍 Processing booking ${booking.id}:`);
      console.log(`   User: ${booking.user_id}, Amount: ${booking.total_price}, Guest: ${booking.guest_name}`);
      
      // หา payment slip ที่เหมาะสมที่สุดสำหรับการจองนี้
      const [availableSlips] = await connection.execute(`
        SELECT id, amount, payment_date, created_at, file_path
        FROM payment_slips 
        WHERE booking_id IS NULL 
          AND user_id = ? 
          AND ABS(amount - ?) <= 1
        ORDER BY 
          ABS(amount - ?) ASC,
          ABS(TIMESTAMPDIFF(MINUTE, created_at, ?)) ASC
        LIMIT 1
      `, [booking.user_id, booking.total_price, booking.total_price, booking.created_at]);
      
      if (availableSlips.length > 0) {
        const bestSlip = availableSlips[0];
        console.log(`   ✅ Best payment slip: ID ${bestSlip.id} (amount: ${bestSlip.amount})`);
        
        // เชื่อมโยง payment slip กับ booking
        await connection.execute(`
          UPDATE payment_slips 
          SET booking_id = ? 
          WHERE id = ?
        `, [booking.id, bestSlip.id]);
        
        console.log(`   ✅ Linked payment slip ${bestSlip.id} to booking ${booking.id}`);
      } else {
        console.log(`   ⚠️  No suitable payment slip found for booking ${booking.id}`);
      }
    }
    
    // แสดงผลลัพธ์สุดท้าย
    console.log('\n📊 Final Results:');
    
    const [linkedBookings] = await connection.execute(`
      SELECT b.id as booking_id, b.guest_name, b.total_price, 
             ps.id as slip_id, ps.amount as slip_amount, ps.file_path
      FROM bookings b
      INNER JOIN payment_slips ps ON b.id = ps.booking_id
      ORDER BY b.id
    `);
    
    console.log(`✅ Successfully linked ${linkedBookings.length} bookings with payment slips:`);
    linkedBookings.forEach(row => {
      console.log(`   Booking ${row.booking_id} (${row.guest_name}): Slip ${row.slip_id} - ${row.slip_amount} THB`);
    });
    
    // แสดง payment slips ที่ยังไม่ได้เชื่อมโยง
    const [unlinkedSlips] = await connection.execute(`
      SELECT id, user_id, amount, created_at
      FROM payment_slips 
      WHERE booking_id IS NULL
      ORDER BY created_at
    `);
    
    if (unlinkedSlips.length > 0) {
      console.log(`\n⚠️  ${unlinkedSlips.length} payment slips remain unlinked:`);
      unlinkedSlips.forEach(slip => {
        console.log(`   Slip ${slip.id}: User ${slip.user_id}, Amount ${slip.amount}`);
      });
    }
    
    await connection.end();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixPaymentSlipAssignments();