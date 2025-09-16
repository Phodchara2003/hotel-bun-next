const mysql = require('mysql2/promise');
require('dotenv').config();

async function createCancellationRequestsTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT
    });
    
    console.log('🔄 Creating cancellation_requests table...');
    
    const sql = `
    CREATE TABLE cancellation_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        user_id INT NOT NULL,
        reason TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        admin_id INT NULL,
        admin_notes TEXT NULL,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        INDEX idx_booking_id (booking_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
    )`;
    
    await connection.execute(sql);
    console.log('✅ Table cancellation_requests created successfully!');
    
    await connection.end();
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('⚠️ Table cancellation_requests already exists');
    } else {
      console.error('❌ Error creating table:', error.message);
    }
  }
}

createCancellationRequestsTable();