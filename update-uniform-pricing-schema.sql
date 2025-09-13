-- สคริปต์แก้ไขฐานข้อมูลให้ห้องพักมีราคาเดียวกันทุกประเภท
-- และเพิ่มตาราง global_settings สำหรับจัดการการตั้งค่าโรงแรม

-- 1. สร้างตาราง global_settings สำหรับเก็บการตั้งค่าทั่วไป
CREATE TABLE IF NOT EXISTS global_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ลบคอลัมน์ price_per_night จาก room_types (ถ้าต้องการเก็บข้อมูลเดิม)
-- ALTER TABLE room_types DROP COLUMN IF EXISTS price_per_night;

-- 3. เพิ่มคอลัมน์ price_per_night ในตาราง rooms แทน (หรือใช้ global setting)
-- วิธีที่ 1: เพิ่มราคาในแต่ละห้อง
-- ALTER TABLE rooms ADD COLUMN IF NOT EXISTS price_per_night DECIMAL(10,2) DEFAULT 0;

-- 4. Insert ราคาเดียวกันสำหรับทุกห้องใน global_settings
INSERT INTO global_settings (setting_key, setting_value, description) 
VALUES 
  ('room_price_per_night', '1500.00', 'ราคาห้องพักต่อคืนสำหรับทุกประเภทห้อง'),
  ('hotel_name', 'Royal Garden Hotel', 'ชื่อโรงแรม'),
  ('hotel_currency', 'THB', 'สกุลเงินที่ใช้'),
  ('check_in_time', '14:00', 'เวลาเช็คอิน'),
  ('check_out_time', '12:00', 'เวลาเช็คเอาต์'),
  ('max_advance_booking_days', '365', 'จำนวนวันสูงสุดที่สามารถจองล่วงหน้าได้')
ON CONFLICT (setting_key) DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  updated_at = CURRENT_TIMESTAMP;

-- 5. อัปเดตราคาในตาราง room_types ให้เป็นราคาเดียวกัน (ถ้ายังคงเก็บไว้)
UPDATE room_types SET 
  price_per_night = (SELECT setting_value::DECIMAL FROM global_settings WHERE setting_key = 'room_price_per_night')
WHERE price_per_night IS NOT NULL;

-- 6. สร้างฟังก์ชันสำหรับดึงราคาห้องพัก
CREATE OR REPLACE FUNCTION get_room_price() 
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN (SELECT setting_value::DECIMAL FROM global_settings WHERE setting_key = 'room_price_per_night');
END;
$$ LANGUAGE plpgsql;

-- 7. สร้างฟังก์ชันสำหรับอัปเดตราคาห้องพักทั้งหมด
CREATE OR REPLACE FUNCTION update_room_price(new_price DECIMAL(10,2)) 
RETURNS BOOLEAN AS $$
BEGIN
  -- อัปเดตใน global_settings
  UPDATE global_settings 
  SET setting_value = new_price::TEXT, updated_at = CURRENT_TIMESTAMP 
  WHERE setting_key = 'room_price_per_night';
  
  -- อัปเดตใน room_types (ถ้ายังมี)
  UPDATE room_types 
  SET price_per_night = new_price, updated_at = CURRENT_TIMESTAMP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. สร้าง View สำหรับข้อมูลห้องพักพร้อมราคา
CREATE OR REPLACE VIEW room_details_with_price AS
SELECT 
  r.id as room_id,
  r.room_number,
  r.floor,
  r.status,
  rt.id as room_type_id,
  rt.name as room_type_name,
  rt.description as room_type_description,
  rt.max_guests,
  rt.size_sqm,
  rt.amenities,
  rt.images,
  rt.type,
  get_room_price() as price_per_night,
  h.id as hotel_id,
  h.name as hotel_name,
  h.address,
  h.city,
  h.country
FROM rooms r
JOIN room_types rt ON r.room_type_id = rt.id
JOIN hotels h ON r.hotel_id = h.id;

-- 9. ดู index เพื่อ performance
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON global_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_type ON rooms(hotel_id, room_type_id);

-- 10. แสดงข้อมูลปัจจุบัน
SELECT 'Current room price setting:' as info, setting_value as price 
FROM global_settings WHERE setting_key = 'room_price_per_night';

SELECT 'Room types with updated prices:' as info;
SELECT id, name, price_per_night FROM room_types ORDER BY id;