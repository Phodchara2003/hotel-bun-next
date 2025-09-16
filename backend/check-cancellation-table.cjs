const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCancellationRequestsTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    });
    
    console.log('🔍 Checking cancellation_requests table structure...');
    
    // Check table structure
    const [columns] = await connection.execute('DESCRIBE cancellation_requests');
    console.log('📋 Table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? 'DEFAULT ' + col.Default : ''}`);
    });
    
    // Check sample data
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM cancellation_requests');
    console.log(`\n📊 Current records: ${rows[0].count}`);
    
    // Show indexes
    const [indexes] = await connection.execute('SHOW INDEX FROM cancellation_requests');
    console.log('\n🔑 Indexes:');
    indexes.forEach(idx => {
      console.log(`  ${idx.Key_name}: ${idx.Column_name}`);
    });
    
    await connection.end();
    console.log('\n✅ Table check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error checking table:', error.message);
  }
}

checkCancellationRequestsTable();