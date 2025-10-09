// คำแนะนำการทดสอบหลังแก้ไขปัญหาเลือกเตียงผิดประเภท

console.log('🎉 แก้ไขปัญหาเลือกเตียงคู่แต่ได้เตียงเดี่ยวเสร็จสมบูรณ์!');
console.log('='.repeat(70));

console.log('\n📋 ปัญหาที่แก้ไข:');
console.log('❌ เลือกเตียงคู่ → ได้ห้อง 510 (เตียงเดี่ยว)');
console.log('❌ ข้อมูล bed_type ในฐานข้อมูลไม่สอดคล้อง');

console.log('\n✅ วิธีแก้ไข:');
console.log('🔧 แก้ไขข้อมูล bed_type ในฐานข้อมูล:');
console.log('   - Double Room (Type ID: 10) → bed_type: "double" (28 ห้อง)');
console.log('   - Single Room (Type ID: 8) → bed_type: "single" (6 ห้อง)');

console.log('\n🧪 การทดสอบ:');
console.log('1. เปิด http://localhost:3002/rooms');
console.log('2. ทดสอบเลือกเตียงคู่:');
console.log('   - คลิก "ห้องเตียงคู่ (Double Room)"');
console.log('   - ทำการจองให้เสร็จสิ้น');
console.log('   - ตรวจสอบหมายเลขห้องที่ได้');
console.log('3. ทดสอบเลือกเตียงเดี่ยว:');
console.log('   - คลิก "ห้องเตียงเดี่ยว (Single Room)"');
console.log('   - ทำการจองให้เสร็จสิ้น');
console.log('   - ตรวจสอบหมายเลขห้องที่ได้');

console.log('\n🔍 ผลลัพธ์ที่คาดหวัง:');
console.log('');
console.log('🔸 เลือกเตียงคู่ → ควรได้:');
console.log('   ห้อง: 501-506, 513-517, 601-617');
console.log('   อีเมล: "ห้องเตียงคู่ (Double Room)"');
console.log('');
console.log('🔸 เลือกเตียงเดี่ยว → ควรได้:');
console.log('   ห้อง: 507-512');
console.log('   อีเมล: "ห้องเตียงเดี่ยว (Single Room)"');

console.log('\n🖥️ Backend Console ที่ควรเห็น:');
console.log('✅ Looking for room type: { roomTypeId: 10, hotelId: 2 } // เตียงคู่');
console.log('✅ Room type found: { id: 10, bed_type: "double", ... }');
console.log('✅ Available rooms found: [ห้อง 501, 502, ...]');
console.log('✅ Room 501 (Floor 5) assigned to booking');

console.log('\n📧 อีเมลยืนยันที่ควรได้รับ:');
console.log('✅ ประเภทห้อง: ตรงกับที่เลือก');
console.log('✅ ประเภทเตียง: ตรงกับที่เลือก');
console.log('✅ หมายเลขห้อง: อยู่ในช่วงที่ถูกต้อง');

console.log('\n❌ สิ่งที่ไม่ควรเกิดขึ้นอีก:');
console.log('❌ เลือกเตียงคู่แต่ได้เตียงเดี่ยว');
console.log('❌ ได้ห้อง 510 เมื่อเลือกเตียงคู่');
console.log('❌ อีเมลแสดงประเภทห้องผิด');

console.log('\n📊 ตารางห้องใหม่:');
console.log('');
console.log('🏠 Single Room (เตียงเดี่ยว):');
console.log('   ห้อง 507, 508, 509, 510, 511, 512');
console.log('   bed_type: "single"');
console.log('');
console.log('🏠 Double Room (เตียงคู่):');
console.log('   ห้อง 501-506, 513-517, 601-617');
console.log('   bed_type: "double"');

console.log('\n🚀 เริ่มทดสอบเลย!');
console.log('📱 ไปที่: http://localhost:3002/rooms');
console.log('👆 เลือกห้องและทำการจอง');
console.log('📬 ตรวจสอบอีเมลยืนยัน');

console.log('\n' + '='.repeat(70));
console.log('🎯 หากยังมีปัญหา:');
console.log('   🔧 ตรวจสอบ Backend Console');
console.log('   📊 ดูข้อมูล roomTypeId ที่ส่ง');
console.log('   🏠 ตรวจสอบหมายเลขห้องที่ได้');
console.log('   📧 ตรวจสอบเนื้อหาอีเมลยืนยัน');
console.log('   💾 ตรวจสอบข้อมูลในฐานข้อมูล');