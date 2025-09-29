const mysql = require('mysql2/promise');

async function createTestBookingForCheckin() {
  try {
    console.log('🏨 Creating new test booking for check-in system...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    // Create a new confirmed booking for today
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const checkInDate = today.toISOString().split('T')[0];
    const checkOutDate = tomorrow.toISOString().split('T')[0];
    
    const bookingReference = `HTL${Math.floor(Math.random() * 900000) + 100000}`;
    
    const [result] = await connection.execute(
      `INSERT INTO bookings (
        user_id, hotel_id, room_type_id, check_in_date, check_out_date, 
        guests, total_price, status, booking_reference, guest_name, 
        guest_phone, guest_email, guest_id_number, special_requests, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        20, // user_id
        2,  // hotel_id
        10, // room_type_id
        checkInDate,
        checkOutDate,
        2,  // guests
        2500.00, // total_price
        'confirmed', // status - ready for check-in
        bookingReference,
        'ทดสอบ Check-in ระบบ',
        '0812345678',
        'test.checkin.new@example.com',
        '1234567890123',
        'ทดสอบระบบ Check-in/Check-out ที่โรงแรม',
      ]
    );
    
    const bookingId = result.insertId;
    console.log('✅ Created test booking:');
    console.log(`   - Booking ID: ${bookingId}`);
    console.log(`   - Reference: ${bookingReference}`);
    console.log(`   - Guest: ทดสอบ Check-in ระบบ`);
    console.log(`   - Check-in Date: ${checkInDate} (วันที่จองในเว็บ)`);
    console.log(`   - Check-out Date: ${checkOutDate} (วันที่จองในเว็บ)`);
    console.log(`   - Status: confirmed (พร้อมสำหรับ Check-in จริงที่โรงแรม)`);
    console.log(`   - actual_check_in_time: null (ยังไม่ได้ Check-in จริง)`);
    console.log(`   - actual_check_out_time: null (ยังไม่ได้ Check-out จริง)`);
    
    await connection.end();
    
    console.log('\n🎯 ตอนนี้สามารถไปที่ http://localhost:3002/admin/checkin-checkout');
    console.log('   เพื่อทดสอบระบบ Check-in/Check-out จริงที่โรงแรมได้แล้ว!');
    
  } catch (error) {
    console.error('❌ Error creating test booking:', error.message);
  }
}

createTestBookingForCheckin();