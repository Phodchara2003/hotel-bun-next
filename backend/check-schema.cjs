// Check rooms table schema

const mysql = require('mysql2/promise');

async function checkRoomsSchema() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔗 Connected to database');
    
    // Check table schema
    const [columns] = await connection.execute(`
      DESCRIBE rooms
    `);
    
    console.log('\n📋 === Rooms Table Schema ===');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
    });
    
    // Check sample data
    console.log('\n📊 === Sample Rooms Data ===');
    const [rooms] = await connection.execute(`
      SELECT * FROM rooms LIMIT 5
    `);
    
    if (rooms.length > 0) {
      console.log('Sample room:', rooms[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkRoomsSchema();