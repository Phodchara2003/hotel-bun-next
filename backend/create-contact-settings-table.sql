-- สร้างตารางสำหรับการตั้งค่าข้อมูลติดต่อ
CREATE TABLE IF NOT EXISTS contact_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- เพิ่มข้อมูลเริ่มต้น
INSERT INTO contact_settings (setting_key, setting_value, description) VALUES
('contact_phone', '02-123-4567', 'หมายเลขโทรศัพท์สำหรับติดต่อ'),
('contact_email', 'support@hotel.com', 'อีเมลสำหรับติดต่อ'),
('contact_address', '123 ถนนสุขุมวิท กรุงเทพฯ 10110', 'ที่อยู่ของโรงแรม'),
('contact_website', 'https://hotel.com', 'เว็บไซต์โรงแรม'),
('contact_facebook', 'https://facebook.com/hotel', 'Facebook Page'),
('contact_line', '@hotel_official', 'LINE Official Account'),
('business_hours', 'จันทร์-อาทิตย์ 24 ชั่วโมง', 'เวลาทำการ')
ON DUPLICATE KEY UPDATE
setting_value = VALUES(setting_value),
description = VALUES(description);