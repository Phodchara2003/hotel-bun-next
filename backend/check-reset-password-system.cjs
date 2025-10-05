const mysql = require('mysql2/promise');
require('dotenv').config();

// ใช้ connection config เดียวกับ mysql-server.cjs
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

async function checkDatabase() {
  let connection;
  
  try {
    console.log('🔗 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    
    // ตรวจสอบ table users
    console.log('\n📋 Checking users table:');
    const [users] = await connection.execute('SELECT id, email, password FROM users LIMIT 5');
    console.table(users);
    
    // ตรวจสอบ table password_reset_tokens
    console.log('\n📋 Checking password_reset_tokens table:');
    const [tokens] = await connection.execute('SELECT * FROM password_reset_tokens ORDER BY created_at DESC LIMIT 5');
    console.table(tokens);
    
    // ตรวจสอบ token ล่าสุด
    console.log('\n🔍 Latest reset token details:');
    const [latestToken] = await connection.execute(
      'SELECT email, token, expires_at, created_at FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1'
    );
    
    if (latestToken.length > 0) {
      const token = latestToken[0];
      console.log('📧 Email:', token.email);
      console.log('🔑 Token:', token.token);
      console.log('⏰ Expires:', token.expires_at);
      console.log('📅 Created:', token.created_at);
      console.log('⌛ Valid:', new Date() < new Date(token.expires_at) ? 'Yes' : 'No');
    } else {
      console.log('❌ No reset tokens found in database');
    }
    
    // ตรวจสอบผู้ใช้ที่ต้องการรีเซ็ต
    console.log('\n👤 Checking user mmoorrttff72308@gmail.com:');
    const [user] = await connection.execute(
      'SELECT id, email, password FROM users WHERE email = ?',
      ['mmoorrttff72308@gmail.com']
    );
    
    if (user.length > 0) {
      console.log('✅ User found in database:');
      console.log('ID:', user[0].id);
      console.log('Email:', user[0].email);
      console.log('Password hash:', user[0].password.substring(0, 20) + '...');
    } else {
      console.log('❌ User not found in database');
      
      // แสดง users ทั้งหมดเพื่อดู
      console.log('\n📝 All users in database:');
      const [allUsers] = await connection.execute('SELECT id, email FROM users');
      console.table(allUsers);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// รันฟังก์ชัน
checkDatabase();