const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkAdminPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    });
    
    console.log('🔍 Checking admin password...');
    
    const [users] = await connection.execute(
      'SELECT id, email, password FROM users WHERE email = ?',
      ['admin@hotel.com']
    );
    
    if (users.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const admin = users[0];
    console.log(`📧 Admin email: ${admin.email}`);
    console.log(`🔑 Stored password hash: ${admin.password.substring(0, 20)}...`);
    
    // Test password comparison
    const testPassword = 'admin123';
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    
    console.log(`🧪 Testing password '${testPassword}': ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    
    if (!isMatch) {
      console.log('🔄 Creating new admin user with correct password...');
      
      // Delete existing admin
      await connection.execute('DELETE FROM users WHERE email = ?', ['admin@hotel.com']);
      
      // Create new admin with correct password
      const newPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(`
        INSERT INTO users (email, password, first_name, last_name, role, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['admin@hotel.com', newPassword, 'Admin', 'User', 'admin', '0999999999']);
      
      console.log('✅ New admin user created successfully!');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdminPassword();