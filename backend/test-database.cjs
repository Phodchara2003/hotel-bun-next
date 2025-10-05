const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'hotel_booking'
    });
    
    console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
    
    // ตรวจสอบว่ามีตารางอะไรบ้าง
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 ตารางในฐานข้อมูล:');
    tables.forEach(table => {
      console.log('  -', Object.values(table)[0]);
    });
    
    // ตรวจสอบข้อมูลห้อง
    const [rooms] = await connection.execute('SELECT * FROM rooms LIMIT 5');
    console.log('\n🏨 ข้อมูลห้องในฐานข้อมูล (5 ห้องแรก):');
    rooms.forEach(room => {
      console.log(`  Room ${room.room_number}: ${room.room_type} - ${room.price} บาท`);
    });
    
    // ตรวจสอบข้อมูลการจอง
    const [bookings] = await connection.execute('SELECT * FROM bookings LIMIT 3');
    console.log(`\n📝 มีการจอง ${bookings.length} รายการ`);
    
    await connection.end();
    console.log('✅ ทดสอบเสร็จสิ้น');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }
}

testDatabaseConnection();