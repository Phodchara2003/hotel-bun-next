const mysql = require('mysql2/promise');

async function createRoomStatusLogsTable() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });

    console.log('📊 Creating room_status_logs table...');

    // Create room_status_logs table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS room_status_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        old_status ENUM('available', 'occupied', 'maintenance', 'reserved') NOT NULL,
        new_status ENUM('available', 'occupied', 'maintenance', 'reserved') NOT NULL,
        admin_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        INDEX idx_room_id (room_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableQuery);
    console.log('✅ room_status_logs table created successfully');

    // Close connection
    await connection.end();
    console.log('📤 Database connection closed');

  } catch (error) {
    console.error('❌ Error creating room_status_logs table:', error);
  }
}

// Run the script
createRoomStatusLogsTable();