-- เพิ่มฟิลด์สำหรับ Check-in/Check-out Timestamps
ALTER TABLE bookings 
ADD COLUMN actual_check_in_time TIMESTAMP NULL COMMENT 'เวลาที่เช็คอินจริง',
ADD COLUMN actual_check_out_time TIMESTAMP NULL COMMENT 'เวลาที่เช็คเอ้าจริง',
ADD COLUMN check_in_staff_id INT(11) NULL COMMENT 'ID ของพนักงานที่ทำการเช็คอิน',
ADD COLUMN check_out_staff_id INT(11) NULL COMMENT 'ID ของพนักงานที่ทำการเช็คเอ้า',
ADD COLUMN check_in_notes TEXT NULL COMMENT 'หมายเหตุการเช็คอิน',
ADD COLUMN check_out_notes TEXT NULL COMMENT 'หมายเหตุการเช็คเอ้า';

-- เพิ่ม Foreign Key สำหรับ staff
-- ALTER TABLE bookings 
-- ADD FOREIGN KEY (check_in_staff_id) REFERENCES users(id),
-- ADD FOREIGN KEY (check_out_staff_id) REFERENCES users(id);