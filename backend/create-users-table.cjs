const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createUsersTableAndAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    });
    
    console.log('🔄 Creating users table...');
    
    // Create users table
    const createUsersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'staff', 'customer') DEFAULT 'customer',
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_role (role)
    )`;
    
    await connection.execute(createUsersTableSQL);
    console.log('✅ Users table created successfully!');
    
    // Check if admin user exists
    const [adminExists] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND role = ?',
      ['admin@hotel.com', 'admin']
    );
    
    if (adminExists.length === 0) {
      // Create admin user
      const adminPassword = await bcrypt.hash('admin123', 10);
      
      await connection.execute(`
        INSERT INTO users (email, password, first_name, last_name, role, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['admin@hotel.com', adminPassword, 'Admin', 'User', 'admin', '0999999999']);
      
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@hotel.com');
      console.log('🔑 Password: admin123');
    } else {
      console.log('⚠️ Admin user already exists');
    }
    
    // Create a test customer user
    const [customerExists] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['customer@test.com']
    );
    
    if (customerExists.length === 0) {
      const customerPassword = await bcrypt.hash('customer123', 10);
      
      await connection.execute(`
        INSERT INTO users (email, password, first_name, last_name, role, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['customer@test.com', customerPassword, 'Test', 'Customer', 'guest', '0888888888']);
      
      console.log('✅ Test customer user created successfully!');
      console.log('📧 Email: customer@test.com');
      console.log('🔑 Password: customer123');
    } else {
      console.log('⚠️ Test customer user already exists');
    }
    
    await connection.end();
    console.log('\n🎉 Setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createUsersTableAndAdmin();