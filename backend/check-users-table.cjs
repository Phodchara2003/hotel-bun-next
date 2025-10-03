const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsersTable() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔍 Checking users table structure...');
    
    try {
      const [columns] = await connection.execute('DESCRIBE users');
      console.log('📋 Users table structure:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type}`);
      });
    } catch (error) {
      console.log('❌ Table does not exist or error:', error.message);
      console.log('🔄 Creating users table...');
      
      // Drop and recreate table
      await connection.execute('DROP TABLE IF EXISTS users');
      
      const createUsersTableSQL = `
      CREATE TABLE users (
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
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsersTable();