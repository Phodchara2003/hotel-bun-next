const mysql = require('mysql2/promise');

async function createNotificationsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'hotel_booking'
  });

  try {
    // สร้างตาราง notifications
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        read_status BOOLEAN DEFAULT FALSE,
        user_id INT NULL,
        related_id INT NULL,
        related_type VARCHAR(50) NULL,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        action_url VARCHAR(500) NULL,
        expires_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_read_status (read_status),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at),
        INDEX idx_priority (priority)
      )
    `);

    console.log('✅ Notifications table created successfully');

    // เพิ่มข้อมูลตัวอย่าง
    await connection.execute(`
      INSERT IGNORE INTO notifications (id, title, message, type, user_id, related_type, priority, created_at) VALUES
      (1, 'ระบบโรงแรมเปิดให้บริการแล้ว', 'ยินดีต้อนรับสู่ระบบจัดการโรงแรม ทุกฟีเจอร์พร้อมใช้งาน', 'success', NULL, 'system', 'high', NOW()),
      (2, 'การจองใหม่เข้ามา', 'มีการจองห้องพักใหม่ที่ต้องการการอนุมัติ', 'info', NULL, 'booking', 'medium', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
      (3, 'การชำระเงินรอดำเนินการ', 'มีการชำระเงินที่รอการตรวจสอบจากเจ้าหน้าที่', 'warning', NULL, 'payment', 'high', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
      (4, 'อัปเดตระบบสำเร็จ', 'ระบบได้รับการอัปเดตฟีเจอร์ใหม่เรียบร้อยแล้ว', 'success', NULL, 'system', 'low', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
      (5, 'การเช็คอินใกล้ถึงเวลา', 'มีลูกค้าที่จะเช็คอินในวันนี้ กรุณาเตรียมห้องพักให้พร้อม', 'info', NULL, 'checkin', 'medium', DATE_SUB(NOW(), INTERVAL 15 MINUTE))
    `);

    console.log('✅ Sample notifications inserted successfully');

  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
  } finally {
    await connection.end();
  }
}

createNotificationsTable();