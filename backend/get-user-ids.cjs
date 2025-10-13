/**
 * ตรวจสอบ user_id ที่ใช้ได้ในระบบ
 */

const mysql = require('mysql2/promise');

// MySQL Connection Configuration
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

async function getUserIds() {
  let connection = null;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    const [users] = await connection.execute(`
      SELECT id, first_name, last_name, email, role 
      FROM users 
      ORDER BY id ASC
    `);
    
    console.log('📋 ผู้ใช้ที่มีอยู่ในระบบ:');
    console.log('='.repeat(50));
    users.forEach(user => {
      console.log(`ID: ${user.id} - ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
    });
    
    if (users.length > 0) {
      console.log(`\n✅ ใช้ user_id: ${users[0].id} สำหรับการทดสอบ`);
      return users[0].id;
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

getUserIds();