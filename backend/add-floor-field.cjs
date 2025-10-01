// เพิ่มฟิลด์ floor ในตาราง room_types
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  charset: 'utf8mb4'
};

async function addFloorField() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // ตรวจสอบโครงสร้างตารางปัจจุบัน
    console.log('\n📋 Checking current room_types table structure...');
    const [currentColumns] = await connection.execute("SHOW COLUMNS FROM room_types");
    console.log('Current columns:', currentColumns.map(col => col.Field));

    // ตรวจสอบว่ามีฟิลด์ floor อยู่แล้วหรือไม่
    const hasFloorField = currentColumns.some(col => col.Field === 'floor');
    
    if (hasFloorField) {
      console.log('✅ Floor field already exists');
    } else {
      console.log('➕ Adding floor field to room_types table...');
      
      // เพิ่มฟิลด์ floor หลังจาก bed_type
      await connection.execute(`
        ALTER TABLE room_types 
        ADD COLUMN floor VARCHAR(10) DEFAULT '1' 
        AFTER bed_type
      `);
      
      console.log('✅ Floor field added successfully');
    }

    // อัพเดตข้อมูลที่มีอยู่ให้มีชั้น
    console.log('\n🔄 Updating existing records with default floor...');
    const [updateResult] = await connection.execute(`
      UPDATE room_types 
      SET floor = '1' 
      WHERE floor IS NULL OR floor = ''
    `);
    
    console.log(`✅ Updated ${updateResult.affectedRows} records with default floor`);

    // แสดงโครงสร้างตารางหลังจากเพิ่มฟิลด์
    console.log('\n📋 Updated room_types table structure:');
    const [newColumns] = await connection.execute("SHOW COLUMNS FROM room_types");
    newColumns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT '${col.Default}'` : ''}`);
    });

    // แสดงข้อมูลตัวอย่าง
    console.log('\n📊 Sample data after update:');
    const [sampleData] = await connection.execute("SELECT id, name, bed_type, floor, price_per_night FROM room_types LIMIT 3");
    console.table(sampleData);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// เรียกใช้ฟังก์ชัน
addFloorField();