// Test complete system with new database
import postgres from 'postgres';

const DATABASE_URL = 'postgresql://neondb_owner:npg_dr8IAjq1xoQD@ep-curly-wind-a1564pc2-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = postgres(DATABASE_URL, { 
  ssl: 'require',
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10
});

console.log('🧪 ทดสอบระบบฐานข้อมูลใหม่...\n');

async function testSystem() {
  try {
    console.log('1️⃣ ทดสอบข้อมูลผู้ใช้...');
    const users = await sql`SELECT id, email, role FROM users ORDER BY role DESC`;
    console.log(`   ✅ พบผู้ใช้ ${users.length} คน:`);
    users.forEach(user => {
      console.log(`      - ${user.email} (${user.role})`);
    });

    console.log('\n2️⃣ ทดสอบข้อมูลโรงแรม...');
    const hotels = await sql`SELECT id, name, rating, city FROM hotels`;
    console.log(`   ✅ พบโรงแรม ${hotels.length} แห่ง:`);
    hotels.forEach(hotel => {
      console.log(`      - ${hotel.name} (${hotel.rating}⭐️) ที่ ${hotel.city}`);
    });

    console.log('\n3️⃣ ทดสอบประเภทห้องพัก...');
    const roomTypes = await sql`
      SELECT rt.id, rt.name, rt.price_per_night, rt.max_guests, rt.size_sqm
      FROM room_types rt
      ORDER BY rt.price_per_night
    `;
    console.log(`   ✅ พบประเภทห้อง ${roomTypes.length} ประเภท:`);
    roomTypes.forEach(room => {
      console.log(`      - ${room.name}: ${room.price_per_night}฿/คืน (${room.max_guests} คน, ${room.size_sqm}ตรม.)`);
    });

    console.log('\n4️⃣ ทดสอบห้องพัก...');
    const rooms = await sql`
      SELECT r.room_number, rt.name as room_type, r.floor, r.status
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.room_number
      LIMIT 10
    `;
    console.log(`   ✅ พบห้องพัก (แสดง 10 ห้องแรก):`);
    rooms.forEach(room => {
      console.log(`      - ห้อง ${room.room_number} (${room.room_type}) ชั้น ${room.floor} - ${room.status}`);
    });

    console.log('\n5️⃣ ทดสอบการตั้งค่าการชำระเงิน...');
    const paymentSettings = await sql`SELECT settings FROM simple_payment_settings ORDER BY created_at DESC LIMIT 1`;
    if (paymentSettings.length > 0) {
      const settings = paymentSettings[0].settings;
      console.log(`   ✅ การตั้งค่าการชำระเงิน:`);
      console.log(`      - ธนาคาร: ${settings.bankName}`);
      console.log(`      - ชื่อบัญชี: ${settings.accountName}`);
      console.log(`      - เลขบัญชี: ${settings.accountNumber}`);
      console.log(`      - PromptPay: ${settings.promptPayId}`);
    }

    console.log('\n6️⃣ ทดสอบสถิติรวม...');
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM hotels) as total_hotels,
        (SELECT COUNT(*) FROM room_types) as total_room_types,
        (SELECT COUNT(*) FROM rooms) as total_rooms,
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT COUNT(*) FROM notifications) as total_notifications
    `;
    
    const s = stats[0];
    console.log(`   👥 ผู้ใช้ทั้งหมด: ${s.total_users} คน`);
    console.log(`   🏨 โรงแรม: ${s.total_hotels} แห่ง`);
    console.log(`   🛏️ ประเภทห้อง: ${s.total_room_types} ประเภท`);
    console.log(`   🏠 ห้องพัก: ${s.total_rooms} ห้อง`);
    console.log(`   📋 การจอง: ${s.total_bookings} รายการ`);
    console.log(`   🔔 การแจ้งเตือน: ${s.total_notifications} รายการ`);

    console.log('\n✅ ทดสอบระบบเสร็จสิ้น - ฐานข้อมูลใหม่พร้อมใช้งาน!');
    
    return true;
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    return false;
  } finally {
    await sql.end();
  }
}

testSystem();
