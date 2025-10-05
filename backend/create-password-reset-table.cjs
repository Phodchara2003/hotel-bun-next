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

async function createPasswordResetTable() {
  let connection;
  
  try {
    console.log('🔗 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📝 Creating password_reset_tokens table...');
    
    // สร้างตาราง password_reset_tokens
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_email (email),
        INDEX idx_expires_at (expires_at)
      )
    `;
    
    await connection.execute(createTableQuery);
    console.log('✅ Table password_reset_tokens created successfully!');
    
    // ทำความสะอาด token ที่หมดอายุ
    await connection.execute('DELETE FROM password_reset_tokens WHERE expires_at < NOW()');
    console.log('🧹 Cleaned up expired tokens');
    
    // แสดงโครงสร้างตาราง
    const [columns] = await connection.execute('DESCRIBE password_reset_tokens');
    console.log('📋 Table structure:');
    console.table(columns);
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// รันฟังก์ชัน
createPasswordResetTable();