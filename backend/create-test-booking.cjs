const mysql = require('mysql2/promise');

async function createTestBooking() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔧 Creating test confirmed booking for check-in testing...');
    
    // สร้างการจองใหม่ที่ยืนยันแล้ว (confirmed)
    const bookingData = {
      user_id: 20, // Manager user
      hotel_id: 2,
      room_type_id: 10,
      check_in_date: new Date().toISOString().split('T')[0], // วันนี้
      check_out_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // พรุ่งนี้
      guests: 2,
      total_price: 2500.00,
      status: 'confirmed', // สำคัญ: ต้องเป็น confirmed เพื่อให้สามารถ check-in ได้
      booking_reference: `HTL${Math.floor(Math.random() * 900000) + 100000}`,
      guest_name: 'ทดสอบ เช็คอิน',
      guest_phone: '0812345678',
      guest_email: 'test.checkin@example.com',
      guest_id_number: '1234567890123',
      special_requests: 'ทดสอบระบบ Check-in/Check-out'
    };
    
    const [result] = await connection.execute(`
      INSERT INTO bookings (
        user_id, hotel_id, room_type_id, check_in_date, check_out_date,
        guests, total_price, status, booking_reference, guest_name,
        guest_phone, guest_email, guest_id_number, special_requests,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      bookingData.user_id, bookingData.hotel_id, bookingData.room_type_id,
      bookingData.check_in_date, bookingData.check_out_date, bookingData.guests,
      bookingData.total_price, bookingData.status, bookingData.booking_reference,
      bookingData.guest_name, bookingData.guest_phone, bookingData.guest_email,
      bookingData.guest_id_number, bookingData.special_requests
    ]);
    
    console.log('✅ Test booking created successfully!');
    console.log('📋 Booking Details:');
    console.log(`  - ID: ${result.insertId}`);
    console.log(`  - Reference: ${bookingData.booking_reference}`);
    console.log(`  - Guest: ${bookingData.guest_name}`);
    console.log(`  - Phone: ${bookingData.guest_phone}`);
    console.log(`  - Status: ${bookingData.status}`);
    console.log(`  - Check-in Date: ${bookingData.check_in_date}`);
    console.log(`  - Check-out Date: ${bookingData.check_out_date}`);
    
    console.log('\n🎯 You can now test the check-in system with this booking!');
    console.log('   Go to: http://localhost:3002/admin/checkin-checkout');
    
    await connection.end();
  } catch (error) {
    console.error('Error creating test booking:', error.message);
  }
}

createTestBooking();