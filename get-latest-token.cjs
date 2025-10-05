const mysql = require('mysql2/promise');

async function getLatestToken() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    const [tokens] = await connection.execute(
      'SELECT token FROM password_reset_tokens WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      ['mmoorrttff72308@gmail.com']
    );
    
    if (tokens.length > 0) {
      console.log('🔑 Latest token:', tokens[0].token);
      return tokens[0].token;
    } else {
      console.log('❌ No tokens found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

getLatestToken();