const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetUserPassword() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345678',
      database: process.env.DB_NAME || 'hotel_booking'
    });

    console.log('✅ Connected to database');

    // Hash new password
    const newPassword = 'user123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await connection.execute(
      'UPDATE users SET password = ? WHERE id = 10',
      [hashedPassword]
    );
    
    console.log(`✅ Password updated for user ID 10`);
    console.log(`📧 Email: mmoorrttff7232208@gmail.com`);
    console.log(`🔑 New Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetUserPassword();