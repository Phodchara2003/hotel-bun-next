const mysql = require('mysql2/promise');

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

async function updateBedTypes() {
  let connection;
  
  try {
    console.log('🛏️  Updating bed types for variety...');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL connected successfully');
    
    // อัปเดตห้องราคาสูงเป็น double bed
    const [result1] = await connection.execute(`
      UPDATE room_types 
      SET bed_type = 'double' 
      WHERE price_per_night >= 1300
    `);
    console.log(`✅ Updated ${result1.changedRows} expensive rooms to 'double' bed`);
    
    // เพิ่มห้องใหม่หลากหลาย bed types สำหรับทดสอบ
    const [result2] = await connection.execute(`
      INSERT INTO room_types (hotel_id, name, description, price_per_night, max_guests, size_sqm, type, bed_type)
      VALUES 
      (2, 'โรงแรมสวีท', 'ห้องสวีทหรูหราพร้อมเตียงควีน', 2500.00, 2, 45, 'suite', 'queen'),
      (2, 'ห้องแฟมิลี่', 'ห้องกว้างขวางสำหรับครอบครัว', 1800.00, 4, 55, 'family', 'king'),
      (2, 'ห้องเอ็กซ์คลูซีฟ', 'ห้องพิเศษเตียงเดี่ยวสำหรับนักธุรกิจ', 900.00, 1, 20, 'standard', 'twin')
    `);
    console.log(`✅ Added ${result2.affectedRows} new room types with different bed types`);
    
    // แสดงข้อมูลอัปเดต
    console.log('\n📋 Updated room types:');
    const [rows] = await connection.execute(`
      SELECT id, name, type, bed_type, price_per_night 
      FROM room_types 
      ORDER BY price_per_night ASC
    `);
    
    rows.forEach(room => {
      console.log(`   - ${room.name}: ${room.type} (${room.bed_type}) - ฿${room.price_per_night}`);
    });
    
    console.log('\n🎉 Bed types updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating bed types:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔚 Database connection closed');
    }
  }
}

updateBedTypes();