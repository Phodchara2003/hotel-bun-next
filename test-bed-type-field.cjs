const mysql = require('mysql2/promise');

// Database connection - same config as mysql-server.cjs
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

async function testBedTypeField() {
  let connection;
  
  try {
    console.log('🧪 Testing bed_type field in room_types table...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ MySQL connected successfully');
    
    // ตรวจสอบโครงสร้างตาราง
    console.log('\n1. Checking table structure:');
    const [structureResult] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'hotel_booking' AND TABLE_NAME = 'room_types' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columns in room_types:');
    structureResult.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(nullable)' : '(not null)'} ${col.COLUMN_DEFAULT ? `default: ${col.COLUMN_DEFAULT}` : ''}`);
    });
    
    // ตรวจสอบข้อมูลที่มีอยู่
    console.log('\n2. Checking existing data:');
    const [dataResult] = await connection.execute(`
      SELECT id, name, type, bed_type, price_per_night 
      FROM room_types 
      ORDER BY id 
      LIMIT 5
    `);
    
    console.log('Sample room types data:');
    dataResult.forEach(room => {
      console.log(`  - ID: ${room.id}, Name: ${room.name}, Type: ${room.type}, Bed Type: ${room.bed_type || 'null'}, Price: ${room.price_per_night}`);
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing bed_type field:', error.message);
    
    if (error.message.includes(`Unknown column 'bed_type'`)) {
      console.log('\n💡 The bed_type column does not exist. You need to run the SQL migration first:');
      console.log('   Run: node run-mysql-bed-type-migration.cjs');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔚 Database connection closed');
    }
  }
}

// Run the test
testBedTypeField();