-- เพิ่มฟิลด์ floor (ชั้น) ในตาราง room_types
ALTER TABLE room_types ADD COLUMN floor VARCHAR(10) DEFAULT '1' AFTER bed_type;

-- อัพเดตข้อมูลที่มีอยู่ให้มีชั้น
UPDATE room_types SET floor = '1' WHERE floor IS NULL OR floor = '';

-- แสดงโครงสร้างตารางหลังจากเพิ่มฟิลด์
DESCRIBE room_types;