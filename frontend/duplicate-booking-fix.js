// แก้ไขปัญหาการกดปุ่มยืนยันการจองซ้ำ
// Fix duplicate booking confirmation button issue

console.log('🔧 Fixing duplicate booking confirmation issue...');

console.log('');
console.log('🎯 ปัญหาที่พบ (Issues Found):');
console.log('❌ สามารถกดปุ่มยืนยันการจองซ้ำได้');
console.log('❌ ทำให้เกิดการจองซ้ำในระบบ');
console.log('❌ ไม่มีการป้องกันการส่งคำขอซ้ำ');
console.log('');

console.log('✅ วิธีแก้ไข (Solutions Applied):');
console.log('');
console.log('1. 🔒 Frontend Protection (payment/create/page.jsx):');
console.log('   - เพิ่ม state isBookingSubmitted');
console.log('   - ป้องกันการเรียกใช้ฟังก์ชันซ้ำ');
console.log('   - แสดงข้อความแจ้งเตือนเมื่อกดซ้ำ');
console.log('   - เปลี่ยนข้อความปุ่มเมื่อเสร็จสิ้น');
console.log('');
console.log('2. 🛡️ Backend Protection (bookings.js):');
console.log('   - ตรวจสอบการจองซ้ำใน 5 นาทีล่าสุด');
console.log('   - ป้องกันการสร้างการจองซ้ำจากผู้ใช้เดียวกัน');
console.log('   - ส่งข้อผิดพลาดเมื่อมีการจองที่ยังไม่เสร็จสิ้น');
console.log('');

console.log('📋 โค้ดก่อนแก้ไข (Before):');
console.log(`
  // Frontend - ไม่มีการป้องกัน
  const handlePaymentConfirm = async () => {
    setIsUploadingReceipt(true);
    // ... สามารถเรียกใช้ซ้ำได้
  };

  // Backend - ไม่มีการตรวจสอบการจองซ้ำ
  .post('/', async ({ body, headers, set }) => {
    // ... ไม่มีการตรวจสอบ duplicate booking
  });
`);

console.log('📋 โค้ดหลังแก้ไข (After):');
console.log(`
  // Frontend - เพิ่มการป้องกัน
  const [isBookingSubmitted, setIsBookingSubmitted] = useState(false);
  
  const handlePaymentConfirm = async () => {
    // ป้องกันการกดซ้ำ
    if (isBookingSubmitted || isUploadingReceipt) {
      toast.error('กำลังดำเนินการอยู่ กรุณารอสักครู่...');
      return;
    }
    
    setIsBookingSubmitted(true);
    // ... ป้องกันการเรียกใช้ซ้ำ
  };

  // Backend - เพิ่มการตรวจสอบ duplicate booking
  const existingPendingBookings = await sql\`
    SELECT id FROM bookings
    WHERE user_id = \${user.id}
    AND status IN ('pending', 'confirmed')
    AND created_at > NOW() - INTERVAL '5 minutes'
  \`;
  
  if (existingPendingBookings.length > 0) {
    return { error: 'คุณมีการจองที่ยังไม่เสร็จสิ้นอยู่' };
  }
`);

console.log('🎉 ผลลัพธ์ (Result):');
console.log('✅ ป้องกันการกดปุ่มยืนยันการจองซ้ำ');
console.log('✅ ปุ่มจะ disable หลังจากกดแล้ว');
console.log('✅ แสดงข้อความแจ้งเตือนเมื่อพยายามกดซ้ำ');
console.log('✅ Backend ตรวจสอบการจองซ้ำใน 5 นาทีล่าสุด');
console.log('✅ ป้องกันการสร้างการจองซ้ำในระบบ');
console.log('');

console.log('🎯 การทำงานของระบบใหม่:');
console.log('1. กดปุ่มยืนยันครั้งแรก → เริ่มกระบวนการจอง');
console.log('2. ปุ่มจะ disable และแสดง "กำลังสร้างการจองและอัพโหลด..."');
console.log('3. หากพยายามกดซ้ำ → แสดงข้อความ "กำลังดำเนินการอยู่"');
console.log('4. Backend ตรวจสอบการจองซ้ำ → ปฏิเสธหากมีการจองล่าสุด');
console.log('5. เสร็จสิ้น → แสดง "การจองเสร็จสิ้นแล้ว"');
console.log('');

console.log('📁 ไฟล์ที่แก้ไข (Modified Files):');
console.log('   ✅ frontend/app/payment/create/page.jsx');
console.log('   ✅ backend/src/routes/bookings.js');
console.log('');
console.log('🚀 การแก้ไขเสร็จสมบูรณ์!');