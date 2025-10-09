// ทดสอบการแก้ไขปัญหาประเภทเตียง

console.log('🧪 ทดสอบการแก้ไขปัญหาประเภทเตียง');
console.log('='.repeat(60));

console.log('\n📋 สิ่งที่แก้ไข:');
console.log('✅ 1. roomsData.js - ใช้ bed_type ต้นฉบับ (single/double)');
console.log('✅ 2. rooms/page.jsx - แสดงชื่อภาษาไทยในการแสดงผล');
console.log('✅ 3. rooms/[id]/page.jsx - ส่ง roomTypeId แทน bed_type');
console.log('✅ 4. payment/create/page.jsx - ลบการแปลง bed_type');

console.log('\n🧪 ขั้นตอนการทดสอบ:');
console.log('1. เปิด http://localhost:3002/rooms');
console.log('2. เลือกห้อง "ห้องเตียงเดี่ยว" (Single Room)');
console.log('3. คลิก BOOK NOW');
console.log('4. กรอกข้อมูลและยืนยันการจอง');
console.log('5. ตรวจสอบอีเมลยืนยันการจอง');

console.log('\n🔍 สิ่งที่ต้องดูใน Console:');
console.log('');
console.log('📱 Frontend Console (F12):');
console.log('🔍 Creating booking with data: { roomTypeId: 8, ... }  // เตียงเดี่ยว');
console.log('🔍 Creating booking with data: { roomTypeId: 10, ... } // เตียงคู่');
console.log('🔍 roomTypeId value: 8 หรือ 10');
console.log('🔍 bed_type from room: "single" หรือ "double"');

console.log('\n🖥️ Backend Console:');
console.log('Looking for room type: { roomTypeId: 8, hotelId: 2 }  // เตียงเดี่ยว');
console.log('Looking for room type: { roomTypeId: 10, hotelId: 2 } // เตียงคู่');
console.log('Room type found: { id: 8, bed_type: "single", ... }');

console.log('\n📧 สิ่งที่ต้องตรวจสอบในอีเมล:');
console.log('✅ ประเภทห้อง: ตรงกับที่เลือก');
console.log('✅ ประเภทเตียง: ตรงกับที่เลือก');
console.log('✅ หมายเลขห้อง: ได้รับการมอบหมายถูกต้อง');

console.log('\n🎯 กรณีทดสอบ:');
console.log('');
console.log('🔸 Test Case 1: เลือกห้องเตียงเดี่ยว');
console.log('   - เลือก "ห้องเตียงเดี่ยว (Single Room)"');
console.log('   - รอผลลัพธ์: roomTypeId = 8, bed_type = "single"');
console.log('   - อีเมลควรแสดง: "เตียงเดี่ยว"');

console.log('\n🔸 Test Case 2: เลือกห้องเตียงคู่');
console.log('   - เลือก "ห้องเตียงคู่ (Double Room)"');
console.log('   - รอผลลัพธ์: roomTypeId = 10, bed_type = "double"');
console.log('   - อีเมลควรแสดง: "เตียงคู่"');

console.log('\n❌ สิ่งที่ไม่ควรเกิดขึ้นอีก:');
console.log('❌ เลือกเตียงคู่แต่ได้เตียงเดี่ยว');
console.log('❌ เลือกเตียงเดี่ยวแต่ได้เตียงคู่');
console.log('❌ อีเมลแสดงประเภทเตียงผิด');

console.log('\n🚀 เริ่มทดสอบเลย!');
console.log('📱 ไปที่: http://localhost:3002/rooms');
console.log('👆 เลือกห้องและทำการจอง');
console.log('👀 ดู Console Log');
console.log('📬 ตรวจสอบอีเมลยืนยัน');

console.log('\n' + '='.repeat(60));
console.log('📞 หากยังมีปัญหา ให้ตรวจสอบ:');
console.log('   🔧 Frontend Console Log');
console.log('   🖥️ Backend Console Log');  
console.log('   📊 ข้อมูลใน localStorage');
console.log('   📧 เนื้อหาอีเมลยืนยัน');