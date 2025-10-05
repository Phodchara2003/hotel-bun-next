// ทดสอบการแก้ไข my-bookings API และ data mapping
console.log('🛠️ ทดสอบการแก้ไข my-bookings data mapping');
console.log('================================================');

// จำลองข้อมูลจาก Backend API (ใช้ camelCase)
const mockApiResponse = {
  bookings: [
    {
      id: 1,
      bookingReference: 'HTL123456',
      hotelName: 'โรงแรมวรุณภัฏ มหาวิทยาลัยราชภัฏมหาสารคาม',
      roomTypeName: 'Standard Room',
      checkInDate: '2025-10-05',
      checkOutDate: '2025-10-06',
      guests: 1,
      totalPrice: 600,
      status: 'pending',
      specialRequests: null,
      createdAt: '2025-10-05T10:00:00Z'
    }
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1
  }
};

console.log('📊 Backend Response (camelCase):');
console.log('  - checkInDate:', mockApiResponse.bookings[0].checkInDate);
console.log('  - checkOutDate:', mockApiResponse.bookings[0].checkOutDate);
console.log('  - hotelName:', mockApiResponse.bookings[0].hotelName);
console.log('  - roomTypeName:', mockApiResponse.bookings[0].roomTypeName);
console.log('');

// จำลองการ map ข้อมูลใน Frontend
const mappedBookings = mockApiResponse.bookings.map(booking => ({
  ...booking,
  check_in_date: booking.checkInDate || booking.check_in_date,
  check_out_date: booking.checkOutDate || booking.check_out_date,
  hotel_name: booking.hotelName || booking.hotel_name,
  room_type_name: booking.roomTypeName || booking.room_type_name
}));

console.log('🔄 Frontend Mapped Data (snake_case):');
console.log('  - check_in_date:', mappedBookings[0].check_in_date);
console.log('  - check_out_date:', mappedBookings[0].check_out_date);
console.log('  - hotel_name:', mappedBookings[0].hotel_name);
console.log('  - room_type_name:', mappedBookings[0].room_type_name);
console.log('');

// ทดสอบการแสดงผลใน UI
const { formatDateThai, calculateNights } = require('./frontend/lib/dateUtils.js');

console.log('📱 ผลลัพธ์ในหน้า UI:');
try {
  const checkInFormatted = formatDateThai(mappedBookings[0].check_in_date);
  const checkOutFormatted = formatDateThai(mappedBookings[0].check_out_date);
  const nights = calculateNights(mappedBookings[0].check_in_date, mappedBookings[0].check_out_date);
  
  console.log('✅ วันที่เข้าพัก:', checkInFormatted);
  console.log('✅ วันที่ออก:', checkOutFormatted);
  console.log('✅ จำนวนคืน:', nights, 'คืน');
  console.log('✅ โรงแรม:', mappedBookings[0].hotel_name);
  console.log('✅ ประเภทห้อง:', mappedBookings[0].room_type_name);
  
} catch (error) {
  console.error('❌ เกิดข้อผิดพลาด:', error.message);
}

console.log('');
console.log('🎯 สรุปการแก้ไข:');
console.log('  ✅ แก้ไข API endpoint: /api/bookings (พร้อม Authorization header)');
console.log('  ✅ แก้ไข response structure: result.bookings (แทน result.data)');
console.log('  ✅ เพิ่ม data mapping: camelCase → snake_case');
console.log('  ✅ Debug logs สำหรับตรวจสอบข้อมูล');
console.log('');
console.log('📱 ตอนนี้หน้า "การจองของฉัน" ควรแสดงวันที่ได้แล้ว!');

// แสดงตัวอย่างการแสดงผลที่ถูกต้อง
console.log('');
console.log('🖼️ ตัวอย่างการแสดงผลที่ถูกต้อง:');
console.log('┌─────────────────────────────────────────────────────┐');
console.log('│ โรงแรมวรุณภัฏ มหาวิทยาลัยราชภัฏมหาสารคาม             │');
console.log('│ รอการยืนยัน                                         │');
console.log('│                                                     │');
console.log('│ วันที่เข้าพัก        วันที่ออก                       │');
console.log('│ แก้ไข                                               │');
console.log('│ วันอาทิตย์ที่ 5       วันจันทร์ที่ 6                  │');
console.log('│ ตุลาคม 2568          ตุลาคม 2568                    │');
console.log('│                                                     │');
console.log('│ จำนวนผู้เข้าพัก                                     │');
console.log('│ 1 คน                                               │');
console.log('└─────────────────────────────────────────────────────┘');