const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    });
    
    console.log('🔍 Checking users in database...');
    
    const [users] = await connection.execute('SELECT id, email, first_name, last_name, role, created_at FROM users');
    
    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  ID: ${user.id} | Email: ${user.email} | Role: ${user.role} | Name: ${user.first_name} ${user.last_name}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();