-- เพิ่มฟิลด์สำหรับการชำระเงินในตาราง bookings
ALTER TABLE bookings 
ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending' AFTER status,
ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL AFTER payment_status,
ADD COLUMN payment_date DATETIME DEFAULT NULL AFTER payment_method;

-- อัปเดต bookings เก่าให้มี payment_status = 'paid' สำหรับที่ status = 'confirmed'
UPDATE bookings 
SET payment_status = 'paid', 
    payment_date = created_at 
WHERE status = 'confirmed';