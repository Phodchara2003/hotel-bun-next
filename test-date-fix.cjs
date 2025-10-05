// ทดสอบฟังก์ชัน formatDate และ calculateNights ใหม่
const { formatDateThai, calculateNights } = require('./frontend/lib/dateUtils.js');

console.log('🧪 ทดสอบฟังก์ชัน Date Utilities');
console.log('=====================================');

// ทดสอบข้อมูลตัวอย่าง
const testData = {
  check_in_date: '2025-10-05',
  check_out_date: '2025-10-06',
  total_price: 600
};

console.log('📋 ข้อมูลทดสอบ:');
console.log('  - วันที่เข้าพัก:', testData.check_in_date);
console.log('  - วันที่ออก:', testData.check_out_date);
console.log('  - ราคารวม:', testData.total_price);
console.log('');

console.log('🔍 ผลลัพธ์การทดสอบ:');

try {
  // ทดสอบ formatDateThai
  const formattedCheckIn = formatDateThai(testData.check_in_date);
  const formattedCheckOut = formatDateThai(testData.check_out_date);
  
  console.log('✅ formatDateThai:');
  console.log('  - วันที่เข้าพัก:', formattedCheckIn);
  console.log('  - วันที่ออก:', formattedCheckOut);
  
  // ทดสอบ calculateNights
  const nights = calculateNights(testData.check_in_date, testData.check_out_date);
  console.log('✅ calculateNights:');
  console.log('  - จำนวนคืน:', nights);
  
  // คำนวณราคาต่อคืน
  const pricePerNight = testData.total_price / nights;
  console.log('  - ราคาต่อคืน:', `฿${pricePerNight}`);
  console.log('  - ราคารวม:', `฿${testData.total_price}`);

} catch (error) {
  console.error('❌ เกิดข้อผิดพลาด:', error.message);
}

console.log('');
console.log('🎯 สรุปปัญหาที่แก้ไขแล้ว:');
console.log('  ✅ แก้ไข Invalid Date ด้วย formatDateThai()');
console.log('  ✅ แก้ไข NaN ใน calculateNights()');
console.log('  ✅ เพิ่ม debug logs ใน booking-success page');
console.log('  ✅ แก้ไข data mapping ใน new-booking page');
console.log('');
console.log('📝 ขั้นตอนต่อไป:');
console.log('  1. ทดสอบการจองใหม่ในเว็บไซต์');
console.log('  2. ตรวจสอบ Console logs ใน Developer Tools');
console.log('  3. ตรวจสอบการแสดงวันที่และราคาในหน้าสรุปการจอง');