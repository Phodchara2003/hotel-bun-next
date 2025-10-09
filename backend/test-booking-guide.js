// ทดสอบการจองแบบจริงเพื่อดูการแจ้งเตือนแอดมิน

console.log('🎯 คำแนะนำการทดสอบระบบแจ้งเตือนแอดมิน');
console.log('='.repeat(60));

console.log('\n📋 ขั้นตอนการทดสอบ:');
console.log('1. เปิดเว็บไซต์: http://localhost:3002');
console.log('2. ล็อกอินด้วยบัญชีลูกค้า');
console.log('3. เลือกห้องที่ต้องการจอง');
console.log('4. กรอกข้อมูลการจอง');
console.log('5. อัพโหลดใบเสร็จและยืนยันการจอง');

console.log('\n📧 ผลลัพธ์ที่คาดหวัง:');
console.log('✅ ลูกค้าได้รับอีเมลยืนยันการจอง');
console.log('✅ แอดมินได้รับอีเมลแจ้งการจองใหม่:');
console.log('   📧 admin@royalgarden.com');
console.log('   📧 admin@test.com');

console.log('\n🔍 การตรวจสอบในเทอร์มินัล:');
console.log('หลังจากทำการจอง ให้ดู Console Log สำหรับข้อความเหล่านี้:');
console.log('');
console.log('✅ Real-time notification sent for booking creation');
console.log('✅ Admin notification sent for new booking');
console.log('✅ [ADMIN-EMAIL] New booking notification sent to admin: admin@royalgarden.com');
console.log('✅ [ADMIN-EMAIL] New booking notification sent to admin: admin@test.com');

console.log('\n💡 หากไม่เห็นข้อความข้างต้น:');
console.log('❌ แสดงว่าระบบแจ้งเตือนแอดมินไม่ทำงาน');
console.log('🔧 รันคำสั่ง: node test-admin-notification.js เพื่อทดสอบ');

console.log('\n🚀 เริ่มทดสอบเลย!');
console.log('📱 ไปที่: http://localhost:3002');
console.log('👤 ล็อกอินและทำการจอง');
console.log('👀 ดู Console Log ของ Backend');
console.log('📬 ตรวจสอบอีเมลแอดมิน');

console.log('\n' + '='.repeat(60));
console.log('📞 หากมีปัญหา สามารถตรวจสอบได้ที่:');
console.log('   🔧 Backend Console Log');
console.log('   📧 การตั้งค่าอีเมลใน .env');
console.log('   👥 รายชื่อแอดมินในฐานข้อมูล');