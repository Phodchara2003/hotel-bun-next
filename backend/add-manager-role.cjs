const mysql = require('mysql2/promise');
require('dotenv').config();

async function addManagerRole() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_booking'
  });

  try {
    console.log('🔄 Adding manager role to users table...');
    
    await connection.execute(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('guest', 'staff', 'manager', 'admin') DEFAULT 'guest'
    `);
    
    console.log('✅ Successfully added manager role!');
    
    // Test by updating a user to manager
    await connection.execute(`
      UPDATE users SET role = 'manager' WHERE id = 11
    `);
    
    console.log('✅ Updated user ID 11 to manager role');
    
  } catch (error) {
    console.error('❌ Error adding manager role:', error);
  } finally {
    await connection.end();
  }
}

addManagerRole();