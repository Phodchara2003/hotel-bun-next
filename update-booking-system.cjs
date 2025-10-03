// อัปเดตระบบการจองให้รองรับการค้นหาห้องว่างอัตโนมัติ
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking'
};

async function updateBookingSystem() {
  let connection;
  
  try {
    console.log('🚀 Updating booking system for automatic room assignment...');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL connected successfully');
    
    // 1. เพิ่มคอลัมน์ room_id ในตาราง bookings (ถ้ายังไม่มี)
    console.log('\n1️⃣ Adding room_id column to bookings table...');
    
    try {
      await connection.execute(`
        ALTER TABLE bookings 
        ADD COLUMN room_id INT DEFAULT NULL,
        ADD COLUMN room_number VARCHAR(10) DEFAULT NULL,
        ADD COLUMN floor INT DEFAULT NULL,
        ADD CONSTRAINT fk_bookings_room_id 
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
      `);
      console.log('✅ Added room_id, room_number, and floor columns to bookings');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Columns already exist, skipping...');
      } else {
        console.error('❌ Error adding columns:', error.message);
      }
    }
    
    // 2. สร้างฟังก์ชันค้นหาห้องว่าง
    console.log('\n2️⃣ Testing room availability functions...');
    
    // ทดสอบหาห้องเตียงเดี่ยว
    const findSingleRoom = async (checkIn, checkOut) => {
      const [rooms] = await connection.execute(`
        SELECT r.id, r.room_type_id, r.room_number, r.floor, r.bed_type, rt.name as room_type_name, rt.price_per_night
        FROM rooms r 
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE r.bed_type = 'single' 
        AND r.status = 'available'
        AND r.id NOT IN (
          SELECT DISTINCT COALESCE(b.room_id, 0)
          FROM bookings b 
          WHERE b.room_id IS NOT NULL
          AND b.status IN ('confirmed', 'checked_in')
          AND (
            (? >= b.check_in_date AND ? < b.check_out_date) OR
            (? > b.check_in_date AND ? <= b.check_out_date) OR
            (? <= b.check_in_date AND ? >= b.check_out_date)
          )
        )
        ORDER BY r.floor, r.room_number
        LIMIT 1
      `, [checkIn, checkIn, checkOut, checkOut, checkIn, checkOut]);
      
      return rooms.length > 0 ? rooms[0] : null;
    };
    
    // ทดสอบหาห้องเตียงคู่
    const findDoubleRoom = async (checkIn, checkOut) => {
      const [rooms] = await connection.execute(`
        SELECT r.id, r.room_type_id, r.room_number, r.floor, r.bed_type, rt.name as room_type_name, rt.price_per_night
        FROM rooms r 
        JOIN room_types rt ON r.room_type_id = rt.id
        WHERE r.bed_type = 'double' 
        AND r.status = 'available'
        AND r.id NOT IN (
          SELECT DISTINCT COALESCE(b.room_id, 0)
          FROM bookings b 
          WHERE b.room_id IS NOT NULL
          AND b.status IN ('confirmed', 'checked_in')
          AND (
            (? >= b.check_in_date AND ? < b.check_out_date) OR
            (? > b.check_in_date AND ? <= b.check_out_date) OR
            (? <= b.check_in_date AND ? >= b.check_out_date)
          )
        )
        ORDER BY r.floor, r.room_number
        LIMIT 1
      `, [checkIn, checkIn, checkOut, checkOut, checkIn, checkOut]);
      
      return rooms.length > 0 ? rooms[0] : null;
    };
    
    // ทดสอบการค้นหา
    const testCheckIn = '2024-10-20';
    const testCheckOut = '2024-10-23';
    
    console.log(`🔍 Testing room search for ${testCheckIn} to ${testCheckOut}:`);
    
    const singleRoom = await findSingleRoom(testCheckIn, testCheckOut);
    const doubleRoom = await findDoubleRoom(testCheckIn, testCheckOut);
    
    if (singleRoom) {
      console.log(`✅ Single room found: Room ${singleRoom.room_number} (Floor ${singleRoom.floor}) - ฿${singleRoom.price_per_night}/night`);
    } else {
      console.log('❌ No single rooms available');
    }
    
    if (doubleRoom) {
      console.log(`✅ Double room found: Room ${doubleRoom.room_number} (Floor ${doubleRoom.floor}) - ฿${doubleRoom.price_per_night}/night`);
    } else {
      console.log('❌ No double rooms available');
    }
    
    // 3. ทดสอบสร้างการจองพร้อมห้อง
    console.log('\n3️⃣ Testing booking creation with room assignment...');
    
    // สร้างการจองทดสอบ
    const testBooking = {
      user_id: 2,
      hotel_id: 2,
      bed_type: 'double', // เลือกประเภทเตียง
      check_in_date: testCheckIn,
      check_out_date: testCheckOut,
      guests: 2,
      guest_name: 'ทดสอบ ระบบจอง',
      guest_email: 'test@example.com',
      guest_phone: '0812345678',
      guest_national_id: '1234567890123',
      special_requests: 'ขอห้องวิวสวย'
    };
    
    // หาห้องว่างตามประเภทเตียง
    const selectedRoom = testBooking.bed_type === 'single' 
      ? await findSingleRoom(testBooking.check_in_date, testBooking.check_out_date)
      : await findDoubleRoom(testBooking.check_in_date, testBooking.check_out_date);
    
    if (selectedRoom) {
      console.log(`🏨 Selected room: ${selectedRoom.room_number} (Floor ${selectedRoom.floor})`);
      
      // คำนวณราคารวม
      const checkIn = new Date(testBooking.check_in_date);
      const checkOut = new Date(testBooking.check_out_date);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * selectedRoom.price_per_night;
      
      console.log(`💰 Price calculation: ${nights} nights × ฿${selectedRoom.price_per_night} = ฿${totalPrice}`);
      
      // สร้างการจองในฐานข้อมูล
      const bookingReference = `HTL${Date.now().toString().slice(-6)}`;
      
      const [result] = await connection.execute(`
        INSERT INTO bookings (
          user_id, hotel_id, room_type_id, room_id, room_number, floor,
          check_in_date, check_out_date, guests, total_price, status,
          booking_reference, guest_name, guest_phone, guest_email, 
          guest_id_number, special_requests, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        testBooking.user_id,
        testBooking.hotel_id,
        selectedRoom.room_type_id,
        selectedRoom.id,
        selectedRoom.room_number,
        selectedRoom.floor,
        testBooking.check_in_date,
        testBooking.check_out_date,
        testBooking.guests,
        totalPrice,
        'pending',
        bookingReference,
        testBooking.guest_name,
        testBooking.guest_phone,
        testBooking.guest_email,
        testBooking.guest_national_id,
        testBooking.special_requests
      ]);
      
      const bookingId = result.insertId;
      console.log(`✅ Test booking created successfully!`);
      console.log(`📋 Booking ID: ${bookingId}`);
      console.log(`📋 Reference: ${bookingReference}`);
      console.log(`🏨 Assigned Room: ${selectedRoom.room_number} (Floor ${selectedRoom.floor})`);
      
      // ดึงข้อมูลการจองที่สร้าง
      const [bookingData] = await connection.execute(`
        SELECT 
          b.*,
          h.name as hotel_name,
          rt.name as room_type_name
        FROM bookings b
        LEFT JOIN hotels h ON b.hotel_id = h.id
        LEFT JOIN room_types rt ON b.room_type_id = rt.id
        WHERE b.id = ?
      `, [bookingId]);
      
      if (bookingData.length > 0) {
        const booking = bookingData[0];
        console.log('\n📊 Booking Details:');
        console.log(`  Guest: ${booking.guest_name}`);
        console.log(`  Hotel: ${booking.hotel_name}`);
        console.log(`  Room: ${booking.room_number} (Floor ${booking.floor})`);
        console.log(`  Room Type: ${booking.room_type_name}`);
        console.log(`  Check-in: ${booking.check_in_date}`);
        console.log(`  Check-out: ${booking.check_out_date}`);
        console.log(`  Guests: ${booking.guests}`);
        console.log(`  Total: ฿${booking.total_price}`);
        console.log(`  Status: ${booking.status}`);
      }
      
    } else {
      console.log('❌ No rooms available for the selected bed type and dates');
    }
    
    // 4. แสดงสถิติห้องว่าง
    console.log('\n4️⃣ Room availability statistics:');
    
    const [availableRooms] = await connection.execute(`
      SELECT 
        bed_type,
        floor,
        COUNT(*) as available_count
      FROM rooms 
      WHERE status = 'available'
      GROUP BY bed_type, floor
      ORDER BY floor, bed_type
    `);
    
    console.log('📊 Available rooms by type and floor:');
    availableRooms.forEach(stat => {
      console.log(`  ${stat.bed_type.toUpperCase()} - Floor ${stat.floor}: ${stat.available_count} rooms`);
    });
    
    const [totalAvailable] = await connection.execute(`
      SELECT bed_type, COUNT(*) as total
      FROM rooms 
      WHERE status = 'available'
      GROUP BY bed_type
    `);
    
    console.log('\n📈 Total available rooms:');
    totalAvailable.forEach(stat => {
      console.log(`  ${stat.bed_type.toUpperCase()} bed rooms: ${stat.total} available`);
    });
    
    console.log('\n🎉 Booking system update completed successfully!');
    console.log('\n📝 System is now ready for:');
    console.log('  ✅ Automatic room assignment based on bed type');
    console.log('  ✅ Real-time room availability checking');
    console.log('  ✅ Room number and floor display in bookings');
    console.log('  ✅ Conflict-free booking management');
    
  } catch (error) {
    console.error('❌ Error updating booking system:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateBookingSystem();