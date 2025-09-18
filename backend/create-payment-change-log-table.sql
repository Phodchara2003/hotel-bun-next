-- สร้างตาราง payment_settings_change_log สำหรับเก็บ log การเปลี่ยนแปลง payment settings
CREATE TABLE IF NOT EXISTS payment_settings_change_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT,
    admin_email VARCHAR(255),
    admin_name VARCHAR(255),
    change_type ENUM('bank_transfer', 'promptpay', 'qr_code', 'all') NOT NULL,
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ข้อมูลเพิ่มเติมสำหรับ tracking
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_change_type (change_type),
    INDEX idx_created_at (created_at)
);

-- เพิ่ม sample data สำหรับ testing
INSERT INTO payment_settings_change_log 
(admin_user_id, admin_email, admin_name, change_type, field_changed, old_value, new_value, change_description) 
VALUES 
(1, 'admin@hotel.com', 'Admin User', 'bank_transfer', 'bank_name', 'ธนาคารกสิกรไทย', 'ธนาคารกรุงศรีอยุธยา', 'เปลี่ยนธนาคารจาก ธนาคารกสิกรไทย เป็น ธนาคารกรุงศรีอยุธยา'),
(1, 'admin@hotel.com', 'Admin User', 'bank_transfer', 'account_number', '123-456-7890', '111-2-33333-4', 'เปลี่ยนเลขบัญชีจาก 123-456-7890 เป็น 111-2-33333-4');
