// Migration script to add 'manager' role to the database ENUM
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking'
};

async function addManagerRole() {
  let connection;
  
  try {
    console.log('🔌 กำลังเชื่อมต่อ MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Show current ENUM values
    console.log('📋 ตรวจสอบ ENUM values ปัจจุบัน...');
    const [currentSchema] = await connection.execute(
      "SHOW COLUMNS FROM users WHERE Field = 'role'"
    );
    console.log('Current role ENUM:', currentSchema[0].Type);
    
    // Update the ENUM to include 'manager'
    console.log('⚡ กำลังอัปเดต role ENUM เพื่อเพิ่ม manager...');
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('guest', 'staff', 'manager', 'admin') 
      DEFAULT 'guest'
    `);
    
    // Verify the change
    console.log('✅ ตรวจสอบการเปลี่ยนแปลง...');
    const [updatedSchema] = await connection.execute(
      "SHOW COLUMNS FROM users WHERE Field = 'role'"
    );
    console.log('Updated role ENUM:', updatedSchema[0].Type);
    
    console.log('🎉 Migration สำเร็จ! ตอนนี้ manager role พร้อมใช้งานแล้ว');
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการ migration:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 แนะนำ: ตรวจสอบว่า MySQL server ทำงานอยู่หรือไม่');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 แนะนำ: ตรวจสอบ username/password ของ database');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 ปิดการเชื่อมต่อ database แล้ว');
    }
  }
}

// Run the migration
addManagerRole();