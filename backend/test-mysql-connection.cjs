// ทดสอบการเชื่อมต่อฐานข้อมูล MySQL
const mysql = require('mysql2/promise');

// MySQL Connection Configuration (ใช้ค่าเดียวกับ mysql-server.cjs)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
};

async function testConnection() {
  let connection;
  
  try {
    console.log('🔌 Testing MySQL connection...');
    console.log('Config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      password: dbConfig.password ? '***hidden***' : 'NO PASSWORD'
    });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database successfully!');

    // Test query
    const [testResult] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query successful:', testResult);

    // Check if room_types table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'room_types'");
    if (tables.length > 0) {
      console.log('✅ room_types table exists');
      
      // Show current columns
      const [columns] = await connection.execute("SHOW COLUMNS FROM room_types");
      console.log('\n📋 Current room_types columns:');
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT '${col.Default}'` : ''}`);
      });
      
      // Check if floor field exists
      const hasFloorField = columns.some(col => col.Field === 'floor');
      console.log(`\n🏢 Floor field exists: ${hasFloorField ? '✅ YES' : '❌ NO'}`);
      
    } else {
      console.log('❌ room_types table does not exist');
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connection closed');
    }
  }
}

testConnection();