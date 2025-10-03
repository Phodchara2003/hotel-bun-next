require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking'
};

async function checkPaymentSettings() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('📋 Payment Settings Table Structure:');
    const [structure] = await connection.execute('DESCRIBE payment_settings');
    console.table(structure);
    
    console.log('\n💳 Payment Settings Data:');
    const [data] = await connection.execute('SELECT * FROM payment_settings');
    console.table(data);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPaymentSettings();