// ทดสอบการแก้ไข API Error 400

console.log('🔧 ทดสอบการแก้ไข API Error 400: Missing bed_type');
console.log('='.repeat(70));

console.log('\n📋 ปัญหาที่แก้ไข:');
console.log('❌ API Error: Missing required fields: ["bed_type"]');
console.log('❌ Frontend ส่งเฉพาะ roomTypeId แต่ Backend ต้องการ bed_type');

console.log('\n✅ วิธีแก้ไข:');
console.log('🔧 เพิ่ม bed_type: room.bed_type ใน bookingData');
console.log('📤 ตอนนี้ส่งทั้ง roomTypeId และ bed_type');

console.log('\n🧪 ขั้นตอนการทดสอบ:');
console.log('1. เปิด http://localhost:3002/rooms');
console.log('2. เลือกห้องใดก็ได้ (เตียงเดี่ยวหรือเตียงคู่)');
console.log('3. คลิก BOOK NOW');
console.log('4. กรอกข้อมูลและกดยืนยันการจอง');

console.log('\n🔍 สิ่งที่ต้องดูใน Console:');
console.log('');
console.log('📱 Frontend Console (F12):');
console.log('🔍 Creating booking with data: {');
console.log('  roomTypeId: 8 หรือ 10,');
console.log('  bed_type: "single" หรือ "double",');
console.log('  // ... ข้อมูลอื่นๆ');
console.log('}');
console.log('🔍 bed_type value: "single" หรือ "double"');

console.log('\n🖥️ Backend Console:');
console.log('✅ ไม่ควรเห็น "Missing required fields" อีกต่อไป');
console.log('✅ ควรเห็น: "Validation passed"');
console.log('✅ ควรเห็น: "Looking for room type: { roomTypeId: X, hotelId: 2 }"');

console.log('\n📊 ตัวอย่างข้อมูลที่ส่ง:');
console.log('');
console.log('🔸 เตียงเดี่ยว:');
console.log('  roomTypeId: 8');
console.log('  bed_type: "single"');
console.log('');
console.log('🔸 เตียงคู่:');
console.log('  roomTypeId: 10');
console.log('  bed_type: "double"');

console.log('\n✅ สิ่งที่ควรเกิดขึ้น:');
console.log('✅ API Error 400 หายไป');
console.log('✅ การจองสำเร็จ');
console.log('✅ ได้รับอีเมลยืนยัน');
console.log('✅ แอดมินได้รับการแจ้งเตือน');
console.log('✅ ประเภทเตียงถูกต้อง');

console.log('\n❌ สิ่งที่ไม่ควรเกิดขึ้นอีก:');
console.log('❌ Missing required fields: ["bed_type"]');
console.log('❌ Request failed with status code 400');
console.log('❌ การจองล้มเหลว');

console.log('\n🚀 เริ่มทดสอบเลย!');
console.log('📱 ไปที่: http://localhost:3002/rooms');
console.log('👆 เลือกห้องและทำการจอง');
console.log('👀 ดู Console ทั้ง Frontend และ Backend');

console.log('\n' + '='.repeat(70));
console.log('📞 หากยังมีปัญหา:');
console.log('   🔧 ตรวจสอบ Console Log');
console.log('   📊 ดูข้อมูลที่ส่งใน Network Tab');
console.log('   🖥️ ดู Backend Response');
console.log('   📧 ตรวจสอบอีเมลยืนยัน');