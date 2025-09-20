-- สร้างตารางการแจ้งเตือน (Notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    read_status BOOLEAN DEFAULT FALSE,
    user_id INT NULL, -- NULL หมายถึงแจ้งเตือนแบบ global สำหรับทุกคน
    related_id INT NULL, -- ID ที่เกี่ยวข้อง เช่น booking_id, room_id
    related_type VARCHAR(50) NULL, -- ประเภทของ related_id เช่น 'booking', 'room', 'payment'
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    action_url VARCHAR(500) NULL, -- URL สำหรับการดำเนินการ
    expires_at DATETIME NULL, -- วันที่หมดอายุของการแจ้งเตือน
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_read_status (read_status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_priority (priority),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- สร้างข้อมูลตัวอย่างการแจ้งเตือน
INSERT INTO notifications (title, message, type, user_id, related_type, priority, created_at) VALUES
('ระบบโรงแรมเปิดให้บริการแล้ว', 'ยินดีต้อนรับสู่ระบบจัดการโรงแรม ทุกฟีเจอร์พร้อมใช้งาน', 'success', NULL, 'system', 'high', NOW()),
('การจองใหม่เข้ามา', 'มีการจองห้องพักใหม่ที่ต้องการการอนุมัติ', 'info', NULL, 'booking', 'medium', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('การชำระเงินรอดำเนินการ', 'มีการชำระเงินที่รอการตรวจสอบจากเจ้าหน้าที่', 'warning', NULL, 'payment', 'high', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
('อัปเดตระบบสำเร็จ', 'ระบบได้รับการอัปเดตฟีเจอร์ใหม่เรียบร้อยแล้ว', 'success', NULL, 'system', 'low', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
('การเช็คอินใกล้ถึงเวลา', 'มีลูกค้าที่จะเช็คอินในวันนี้ กรุณาเตรียมห้องพักให้พร้อม', 'info', NULL, 'checkin', 'medium', DATE_SUB(NOW(), INTERVAL 15 MINUTE));