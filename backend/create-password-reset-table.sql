-- สร้างตาราง password_reset_tokens สำหรับระบบ forgot password
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at)
);

-- เพิ่ม index สำหรับประสิทธิภาพ
-- DROP INDEX IF EXISTS idx_token ON password_reset_tokens;
-- DROP INDEX IF EXISTS idx_email ON password_reset_tokens;
-- DROP INDEX IF EXISTS idx_expires_at ON password_reset_tokens;

-- สร้าง index ใหม่
-- CREATE INDEX idx_token ON password_reset_tokens (token);
-- CREATE INDEX idx_email ON password_reset_tokens (email);
-- CREATE INDEX idx_expires_at ON password_reset_tokens (expires_at);

-- ลบ token ที่หมดอายุแล้ว (cleanup)
DELETE FROM password_reset_tokens WHERE expires_at < NOW();