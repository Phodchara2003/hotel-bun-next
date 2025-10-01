const mysql = require('mysql2/promise');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hotel_booking'
});

(async () => {
  try {
    await connection.connect();
    const [rows] = await connection.execute('DESCRIBE room_types');
    console.log('📋 room_types table structure:');
    rows.forEach(row => {
      console.log(`  ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(required)'} ${row.Key ? '[' + row.Key + ']' : ''}`);
    });
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();