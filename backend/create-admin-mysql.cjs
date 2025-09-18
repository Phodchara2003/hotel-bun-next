// Create Admin User for MySQL Testing
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const createAdminUser = async () => {
  let connection;
  
  try {
    console.log('🔐 Creating Admin User for MySQL...');
    
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('✅ Connected to MySQL database');
    
    // Check if admin exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@hotel.com']
    );
    
    if (existingUsers.length > 0) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email:', existingUsers[0].email);
      console.log('🎭 Role:', existingUsers[0].role);
      console.log('🔑 Updating password to admin123...');
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, 'admin@hotel.com']
      );
      
      console.log('✅ Admin password updated successfully');
      return;
    }
    
    // Create admin user with hashed password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const [result] = await connection.execute(`
      INSERT INTO users (email, password, first_name, last_name, role, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'admin@hotel.com',
      hashedPassword,
      'Admin',
      'User',
      'admin',
      '0999999999'
    ]);
    
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@hotel.com');
    console.log('🔑 Password: admin123');
    console.log('🎭 Role: admin');
    console.log('📱 Phone: 0999999999');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run the function
createAdminUser();