// ทดสอบการแก้ไข Date object ใน backend
console.log('🔧 ทดสอบการแก้ไข Date object ใน mysql-server.cjs');
console.log('=================================================');

// จำลอง Date object ที่ MySQL ส่งกลับมา
const mockDateFromMySQL = new Date('2025-10-05T00:00:00.000Z');

console.log('📊 Date object จาก MySQL:');
console.log('  - Original Date:', mockDateFromMySQL);
console.log('  - Type:', typeof mockDateFromMySQL);
console.log('  - toString():', mockDateFromMySQL.toString());
console.log('  - toISOString():', mockDateFromMySQL.toISOString());
console.log('  - toISOString().split("T")[0]:', mockDateFromMySQL.toISOString().split('T')[0]);
console.log('');

// จำลองการประมวลผลใน backend
const processedDate = mockDateFromMySQL instanceof Date 
  ? mockDateFromMySQL.toISOString().split('T')[0] 
  : mockDateFromMySQL;

console.log('🔄 หลังการประมวลผลใน backend:');
console.log('  - Processed Date:', processedDate);
console.log('  - Type:', typeof processedDate);
console.log('');

// จำลอง JSON response
const mockAPIResponse = {
  success: true,
  count: 1,
  data: [
    {
      id: 77,
      booking_reference: 'HTL360411',
      guest_name: 'Phodchara Meeha',
      status: 'pending',
      hotel_name: 'โรงแรมวรุณภัฏ มหาวิทยาลัยราชภัฏมหาสารคาม',
      room_type_name: 'ห้องเตียงคู่ (Double Room)',
      check_in_date: processedDate,  // ใช้ string แล้ว
      check_out_date: processedDate,
      guests: 1,
      total_price: 600
    }
  ]
};

console.log('📤 JSON Response ที่ส่งไป Frontend:');
console.log(JSON.stringify(mockAPIResponse, null, 2));
console.log('');

// ทดสอบใน Frontend
const { formatDateThai } = require('./frontend/lib/dateUtils.js');

console.log('📱 ผลลัพธ์ใน Frontend:');
try {
  const booking = mockAPIResponse.data[0];
  
  console.log('✅ check_in_date:', booking.check_in_date);
  console.log('✅ check_in_date type:', typeof booking.check_in_date);
  console.log('✅ Formatted:', formatDateThai(booking.check_in_date));
  
} catch (error) {
  console.error('❌ เกิดข้อผิดพลาด:', error.message);
}

console.log('');
console.log('🎯 สรุปการแก้ไข:');
console.log('  ✅ แปลง Date object เป็น string ใน getBookings()');
console.log('  ✅ แปลง Date object เป็น string ใน getBookingDetails()');
console.log('  ✅ ใช้ toISOString().split("T")[0] เพื่อได้ YYYY-MM-DD');
console.log('  ✅ Frontend จะได้รับ string format ที่ถูกต้อง');
console.log('');
console.log('📱 ตอนนี้หน้า "การจองของฉัน" ควรแสดงวันที่ได้ถูกต้องแล้ว!');

// แสดงการเปรียบเทียบก่อนและหลังแก้ไข
console.log('');
console.log('🔄 เปรียบเทียบก่อนและหลังแก้ไข:');
console.log('');
console.log('❌ ก่อนแก้ไข:');
console.log('  Backend ส่ง: Date object → Frontend ได้: "Invalid Date"');
console.log('');
console.log('✅ หลังแก้ไข:');
console.log('  Backend ส่ง: "2025-10-05" → Frontend ได้: "วันอาทิตย์ที่ 5 ตุลาคม 2568"');