const mysql = require('mysql2/promise');
require('dotenv').config();

async function testProfileAPI() {
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hotel_booking'
    });

    console.log('✅ Connected to database');

    // Check users in database
    const [users] = await connection.execute('SELECT id, username, email, first_name, last_name FROM users LIMIT 5');
    console.log('👥 Users in database:', users);

    // Test login for first user
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`🔍 Testing with user: ${firstUser.username} (ID: ${firstUser.id})`);
      
      // Try to make a login request
      const loginData = {
        username: firstUser.username,
        password: 'test123' // You might need to adjust this
      };
      
      console.log('📤 Attempting login with:', loginData);
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });
      
      const result = await response.json();
      console.log('📨 Login response:', result);
      
      if (result.success && result.token) {
        // Test profile API
        console.log('🔑 Testing profile API with token:', result.token.substring(0, 20) + '...');
        
        const profileResponse = await fetch('http://localhost:3001/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${result.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const profileResult = await profileResponse.text();
        console.log('👤 Profile API response:', profileResult);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testProfileAPI();