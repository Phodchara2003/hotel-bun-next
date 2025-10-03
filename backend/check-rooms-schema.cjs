const mysql = require('mysql2/promise');

async function checkRoomsSchema() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'hotel_booking'
  });
  
  try {
    const [tables] = await connection.execute('SHOW TABLES LIKE "rooms"');
    if (tables.length > 0) {
      console.log('📋 Rooms table structure:');
      const [columns] = await connection.execute('DESCRIBE rooms');
      columns.forEach(col => {
        console.log(`  ${col.Field} - ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
      console.log('\n📊 Sample rooms data:');
      const [rows] = await connection.execute('SELECT * FROM rooms LIMIT 5');
      console.table(rows);
    } else {
      console.log('❌ Rooms table does not exist');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await connection.end();
}

checkRoomsSchema();