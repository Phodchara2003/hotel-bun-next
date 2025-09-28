const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

async function checkTables() {
  let connection;
  try {
    console.log('🔍 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!');
    
    console.log('\n📋 Checking available tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Available tables:');
    tables.forEach(table => {
      console.log('  - ' + Object.values(table)[0]);
    });
    
    // ตรวจสอบตาราง cancellation_requests
    try {
      const [cancellations] = await connection.execute('SELECT COUNT(*) as count FROM cancellation_requests');
      console.log('\n📊 Cancellation requests count:', cancellations[0].count);
      
      if (cancellations[0].count > 0) {
        const [data] = await connection.execute('SELECT * FROM cancellation_requests ORDER BY requested_at DESC LIMIT 5');
        console.log('\n📋 Latest cancellation requests:');
        data.forEach(req => {
          console.log('  ID: ' + req.id + ', Booking: ' + req.booking_id + ', Status: ' + req.status + ', Date: ' + req.requested_at);
        });
      } else {
        console.log('\n📋 No cancellation requests found in database');
      }
    } catch (error) {
      console.log('\n❌ cancellation_requests table error:', error.message);
      
      // ลองสร้างตาราง cancellation_requests
      console.log('\n🔧 Attempting to create cancellation_requests table...');
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS cancellation_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          booking_id INT NOT NULL,
          guest_name VARCHAR(255),
          guest_email VARCHAR(255),
          guest_phone VARCHAR(255),
          room_type_name VARCHAR(255),
          check_in_date DATE,
          check_out_date DATE,
          total_amount DECIMAL(10,2),
          reason TEXT,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processed_at TIMESTAMP NULL,
          admin_id INT,
          admin_notes TEXT
        )
      `;
      
      await connection.execute(createTableSQL);
      console.log('✅ cancellation_requests table created successfully!');
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
  }
}

checkTables();