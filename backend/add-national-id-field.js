import mysql from 'mysql2/promise';

async function addUserFields() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'hotel_db'
  });
  
  try {
    // ตรวจสอบว่ามีฟิลด์อยู่แล้วหรือไม่
    const [columns] = await connection.execute('SHOW COLUMNS FROM users LIKE "national_id"');
    
    if (columns.length === 0) {
      console.log('เพิ่มฟิลด์ national_id...');
      await connection.execute('ALTER TABLE users ADD COLUMN national_id VARCHAR(17)');
      await connection.execute('CREATE INDEX idx_users_national_id ON users(national_id)');
      console.log('✅ เพิ่มฟิลด์ national_id สำเร็จ');
    } else {
      console.log('✅ ฟิลด์ national_id มีอยู่แล้ว');
    }
    
    // ตรวจสอบ address
    const [addressColumns] = await connection.execute('SHOW COLUMNS FROM users LIKE "address"');
    if (addressColumns.length === 0) {
      console.log('เพิ่มฟิลด์ address...');
      await connection.execute('ALTER TABLE users ADD COLUMN address TEXT');
      console.log('✅ เพิ่มฟิลด์ address สำเร็จ');
    } else {
      console.log('✅ ฟิลด์ address มีอยู่แล้ว');
    }
    
    // แสดงโครงสร้างตารางใหม่
    const [structure] = await connection.execute('DESCRIBE users');
    console.log('\n📋 โครงสร้างตาราง users:');
    structure.forEach(row => {
      console.log(`- ${row.Field} (${row.Type})`);
    });
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    await connection.end();
  }
}

addUserFields();