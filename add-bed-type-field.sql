-- เพิ่มฟิลด์ bed_type ในตาราง room_types
ALTER TABLE room_types 
ADD bed_type VARCHAR(20) DEFAULT 'single';

-- เพิ่ม comment สำหรับ bed_type field
COMMENT ON COLUMN room_types.bed_type IS 'ประเภทเตียง: single, double, queen, king, twin';

-- อัปเดตข้อมูลที่มีอยู่แล้วให้มี bed_type เป็น 'double' สำหรับห้องที่ราคาสูง
UPDATE room_types 
SET bed_type = 'double' 
WHERE price_per_night > 1500;

-- อัปเดตข้อมูลที่มีอยู่แล้วให้มี bed_type เป็น 'queen' สำหรับห้องประเภท suite
UPDATE room_types 
SET bed_type = 'queen' 
WHERE type = 'suite';

-- แสดงข้อมูลหลังอัปเดต
SELECT id, name, type, bed_type, price_per_night 
FROM room_types 
ORDER BY id;

-- สร้าง index สำหรับ bed_type
CREATE INDEX IF NOT EXISTS idx_room_types_bed_type ON room_types(bed_type);