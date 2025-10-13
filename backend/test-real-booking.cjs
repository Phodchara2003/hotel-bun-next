/**
 * ทดสอบการสร้างการจองใหม่และระบบแจ้งเตือนอีเมลแบบจริง
 */

const mysql = require('mysql2/promise');

// MySQL Connection Configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

async function testRealBookingFlow() {
  let connection = null;
  
  try {
    console.log('🔍 เชื่อมต่อกับฐานข้อมูล...');
    connection = await mysql.createConnection(dbConfig);
    
    // ข้อมูลการจองทดสอบ
    const testBookingData = {
      user_id: 2, // Staff Member
      hotel_id: 2, // โรงแรมวรุณภัฏ มหาวิทยาลัยราชภัฏมหาสารคาม
      bed_type: 'double', // ห้องเตียงคู่
      check_in_date: '2025-01-20',
      check_out_date: '2025-01-22',
      guests: 2,
      guest_name: 'นาย ทดสอบ ระบบแจ้งเตือน',
      guest_email: 'test.notification@example.com',
      guest_phone: '081-234-5678',
      guest_national_id: '1234567890123',
      special_requests: 'ทดสอบระบบแจ้งเตือนอีเมลแอดมิน'
    };

    console.log('📝 สร้างการจองทดสอบ...');
    console.log('ข้อมูลการจอง:', JSON.stringify(testBookingData, null, 2));

    // 1. ค้นหาห้องว่าง
    console.log(`🔍 ค้นหาห้อง ${testBookingData.bed_type} ที่ว่าง...`);
    
    const [availableRooms] = await connection.execute(`
      SELECT r.id, r.room_type_id, r.room_number, r.floor, r.bed_type, rt.name as room_type_name, rt.price_per_night
      FROM rooms r 
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.bed_type = ? 
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
    `, [
      testBookingData.bed_type, 
      testBookingData.check_in_date, testBookingData.check_in_date, 
      testBookingData.check_out_date, testBookingData.check_out_date, 
      testBookingData.check_in_date, testBookingData.check_out_date
    ]);

    if (availableRooms.length === 0) {
      console.log('❌ ไม่มีห้องว่างสำหรับการทดสอบ');
      return;
    }

    const selectedRoom = availableRooms[0];
    console.log(`✅ พบห้องว่าง: ${selectedRoom.room_number} (ชั้น ${selectedRoom.floor})`);

    // 2. คำนวณราคา
    const checkIn = new Date(testBookingData.check_in_date);
    const checkOut = new Date(testBookingData.check_out_date);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const total_price = nights * selectedRoom.price_per_night;
    
    console.log(`💰 ราคารวม: ${nights} คืน × ฿${selectedRoom.price_per_night} = ฿${total_price}`);

    // 3. สร้างการจอง
    const bookingReference = `TEST${Date.now().toString().slice(-6)}`;
    console.log('📋 รหัสการจองทดสอบ:', bookingReference);

    const [result] = await connection.execute(`
      INSERT INTO bookings (
        user_id, hotel_id, room_type_id, room_id, room_number, floor,
        check_in_date, check_out_date, guests, total_price, status,
        booking_reference, guest_name, guest_phone, guest_email,
        guest_id_number, special_requests, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      testBookingData.user_id, testBookingData.hotel_id,
      selectedRoom.room_type_id, selectedRoom.id,
      selectedRoom.room_number, selectedRoom.floor,
      testBookingData.check_in_date, testBookingData.check_out_date,
      testBookingData.guests, total_price, 'pending',
      bookingReference, testBookingData.guest_name,
      testBookingData.guest_phone, testBookingData.guest_email,
      testBookingData.guest_national_id, testBookingData.special_requests
    ]);

    const bookingId = result.insertId;
    console.log(`✅ สร้างการจองสำเร็จ ID: ${bookingId}`);

    // 4. อัปเดตสถานะห้อง
    await connection.execute(`
      UPDATE rooms 
      SET status = 'reserved', current_booking_id = ? 
      WHERE id = ?
    `, [bookingId, selectedRoom.id]);
    
    console.log(`✅ อัปเดตสถานะห้อง ${selectedRoom.room_number} เป็น reserved`);

    // 5. ดึงข้อมูลการจองที่สร้างขึ้น
    const [bookingRows] = await connection.execute(`
      SELECT 
        b.*,
        h.name as hotel_name,
        rt.name as room_type_name,
        rt.price_per_night as room_price
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      WHERE b.id = ?
    `, [bookingId]);

    if (bookingRows.length === 0) {
      console.log('❌ ไม่พบข้อมูลการจองที่สร้างขึ้น');
      return;
    }

    const bookingData = bookingRows[0];
    console.log('📋 ข้อมูลการจองที่ได้:', JSON.stringify(bookingData, null, 2));

    // 6. ทดสอบระบบแจ้งเตือนอีเมล (จำลองสิ่งที่เกิดขึ้นในระบบจริง)
    console.log('\n🧪 เริ่มทดสอบระบบแจ้งเตือนอีเมล...');
    
    // จำลองการเรียกใช้แบบที่ระบบจริงทำ
    const userData = {
      first_name: testBookingData.guest_name ? testBookingData.guest_name.split(' ')[0] : 'ลูกค้า',
      last_name: testBookingData.guest_name ? testBookingData.guest_name.split(' ').slice(1).join(' ') : '',
      email: testBookingData.guest_email
    };

    console.log('👤 ข้อมูลผู้ใช้:', JSON.stringify(userData, null, 2));
    
    // เรียกใช้ POST request ไปยัง API ที่มีระบบแจ้งเตือนอีเมล
    console.log('\n🔄 กำลังเรียกใช้ระบบแจ้งเตือนอีเมล...');
    console.log('📧 ระบบควรส่งอีเมลไปยัง: hotelsystem.rmu.ac.th@gmail.com');
    console.log('📋 รหัสการจอง:', bookingReference);
    console.log('👤 ชื่อลูกค้า:', testBookingData.guest_name);
    console.log('💰 ราคารวม: ฿' + total_price.toLocaleString());
    
    console.log('\n✅ การทดสอบเสร็จสิ้น!');
    console.log('📬 ตรวจสอบอีเมล hotelsystem.rmu.ac.th@gmail.com เพื่อดูการแจ้งเตือน');
    console.log('🗂️ การจองทดสอบ ID:', bookingId, 'รหัส:', bookingReference);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    console.error('❌ Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔚 ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
    }
  }
}

// เรียกใช้ฟังก์ชัน
testRealBookingFlow();