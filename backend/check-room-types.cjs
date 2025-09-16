const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRoomTypesTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hotel_booking'
    });
    
    console.log('📊 Checking room_types table structure...');
    const [columns] = await connection.execute('DESCRIBE room_types');
    console.log('Columns in room_types:');
    columns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    console.log('\n📋 Sample data from room_types:');
    const [rows] = await connection.execute('SELECT id, name, hotel_id, available FROM room_types LIMIT 3');
    console.log(rows);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRoomTypesTable();