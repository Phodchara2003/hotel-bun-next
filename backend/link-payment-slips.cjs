const mysql = require('mysql2/promise');

async function linkPaymentSlipsToBookings() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔌 Connected to database');
    
    // ดึง payment slips ที่ไม่มี booking_id
    const [unlinkedSlips] = await connection.execute(`
      SELECT id, user_id, amount, payment_date, created_at 
      FROM payment_slips 
      WHERE booking_id IS NULL AND user_id IS NOT NULL
      ORDER BY created_at DESC
    `);
    
    console.log(`📋 Found ${unlinkedSlips.length} unlinked payment slips`);
    
    for (const slip of unlinkedSlips) {
      console.log(`\n🔍 Processing payment slip ID ${slip.id}:`);
      console.log(`   User: ${slip.user_id}, Amount: ${slip.amount}, Date: ${slip.payment_date}`);
      
      // หา booking ที่ตรงกับ user_id และมีจำนวนเงินใกล้เคียง
      const [matchingBookings] = await connection.execute(`
        SELECT id, user_id, total_price, check_in_date, created_at,
               ABS(total_price - ?) as price_diff
        FROM bookings 
        WHERE user_id = ? 
        AND status IN ('pending', 'confirmed')
        AND ABS(total_price - ?) <= 100
        ORDER BY 
          ABS(total_price - ?) ASC,
          ABS(TIMESTAMPDIFF(MINUTE, created_at, ?)) ASC
        LIMIT 3
      `, [slip.amount, slip.user_id, slip.amount, slip.amount, slip.created_at]);
      
      if (matchingBookings.length > 0) {
        const bestMatch = matchingBookings[0];
        console.log(`   ✅ Best match: Booking ${bestMatch.id} (price diff: ${bestMatch.price_diff})`);
        
        // อัปเดต payment slip ให้เชื่อมโยงกับ booking
        await connection.execute(`
          UPDATE payment_slips 
          SET booking_id = ? 
          WHERE id = ?
        `, [bestMatch.id, slip.id]);
        
        console.log(`   ✅ Linked payment slip ${slip.id} to booking ${bestMatch.id}`);
      } else {
        console.log(`   ⚠️  No matching booking found for payment slip ${slip.id}`);
      }
    }
    
    // แสดงผลลัพธ์
    const [linkedCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM payment_slips 
      WHERE booking_id IS NOT NULL
    `);
    
    console.log(`\n📊 Summary: ${linkedCount[0].count} payment slips now linked to bookings`);
    
    // แสดง booking IDs ที่มี payment slips
    const [bookingIds] = await connection.execute(`
      SELECT DISTINCT booking_id, COUNT(*) as slip_count 
      FROM payment_slips 
      WHERE booking_id IS NOT NULL 
      GROUP BY booking_id 
      ORDER BY booking_id
    `);
    
    console.log('🎯 Bookings with payment slips:');
    bookingIds.forEach(row => {
      console.log(`   Booking ${row.booking_id}: ${row.slip_count} slips`);
    });
    
    await connection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

linkPaymentSlipsToBookings();