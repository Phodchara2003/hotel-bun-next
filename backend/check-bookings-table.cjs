require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking'
};

async function checkBookingsTable() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('📋 Bookings Table Structure:');
    const [structure] = await connection.execute('DESCRIBE bookings');
    structure.forEach(field => {
      console.log(`  ${field.Field}: ${field.Type} ${field.Null === 'NO' ? '(required)' : '(optional)'}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBookingsTable();