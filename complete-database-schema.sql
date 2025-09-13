-- Hotel Management System Database Schema
-- Created for PostgreSQL 15+
-- Full database schema with all necessary tables and sample data

-- =========================================
-- CORE TABLES
-- =========================================

-- 1. Users table - สำหรับข้อมูลผู้ใช้ทั้งหมด
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user', -- user, staff, admin, super_admin
  address TEXT,
  username VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hotels table - ข้อมูลโรงแรม
CREATE TABLE hotels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  images TEXT[], -- Array of image URLs
  amenities TEXT[], -- Array of amenities
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Room types table - ประเภทห้องพัก
CREATE TABLE room_types (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_per_night DECIMAL(10,2) NOT NULL,
  max_guests INTEGER NOT NULL,
  size_sqm INTEGER,
  amenities TEXT[],
  images TEXT[],
  type VARCHAR(50), -- standard, deluxe, suite, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Rooms table - ห้องพักจริง
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  floor INTEGER,
  status VARCHAR(20) DEFAULT 'available', -- available, occupied, maintenance, cleaning, out_of_order
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(hotel_id, room_number)
);

-- 5. Bookings table - การจองห้องพัก
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guests INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
  special_requests TEXT,
  booking_reference VARCHAR(50) UNIQUE NOT NULL,
  guest_name VARCHAR(255),
  guest_phone VARCHAR(20),
  guest_email VARCHAR(255),
  guest_address TEXT,
  guest_id_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Notifications table - ระบบแจ้งเตือน
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- booking_confirmed, booking_cancelled, payment_reminder, check_in_reminder
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Reviews table - รีวิวจากลูกค้า
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- PAYMENT & SETTINGS TABLES
-- =========================================

-- 8. Payment settings table - การตั้งค่าการชำระเงิน
CREATE TABLE simple_payment_settings (
  id SERIAL PRIMARY KEY,
  settings JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Payment settings table (alternative name) - สำหรับระบบ QR Code
CREATE TABLE payment_settings (
  id SERIAL PRIMARY KEY,
  bank_name VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  qr_code_image TEXT,
  prompt_pay_id VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ADVANCED MANAGEMENT TABLES
-- =========================================

-- 10. Room status tracking - ติดตามสถานะห้องพัก
CREATE TABLE room_status (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  -- available, occupied, maintenance, cleaning, out_of_order
  current_booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  last_checkout TIMESTAMP,
  last_cleaning TIMESTAMP,
  notes TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id)
);

-- 11. Check-ins table - ระบบเช็คอิน
CREATE TABLE check_ins (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  guest_phone VARCHAR(20),
  guest_email VARCHAR(255),
  guest_id_number VARCHAR(50),
  guest_address TEXT,
  number_of_guests INTEGER NOT NULL,
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checked_in_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Check-outs table - ระบบเช็คเอาท์
CREATE TABLE check_outs (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  check_out_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  room_condition VARCHAR(50), -- excellent, good, fair, poor, damaged
  minibar_charges DECIMAL(10,2) DEFAULT 0,
  damage_charges DECIMAL(10,2) DEFAULT 0,
  total_additional_charges DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, partial
  notes TEXT,
  checked_out_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Housekeeping tasks - งานแม่บ้าน
CREATE TABLE housekeeping_tasks (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL, -- cleaning, maintenance, inspection
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  assigned_to INTEGER REFERENCES users(id),
  estimated_duration INTEGER, -- minutes
  actual_duration INTEGER, -- minutes
  notes TEXT,
  completed_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Room inspections - การตรวจสอบห้องพัก
CREATE TABLE room_inspections (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
  inspector_id INTEGER REFERENCES users(id),
  inspection_type VARCHAR(50), -- daily, weekly, monthly, checkout, maintenance
  status VARCHAR(20) DEFAULT 'pending', -- pending, passed, failed, needs_attention
  cleanliness_score INTEGER CHECK (cleanliness_score >= 1 AND cleanliness_score <= 5),
  maintenance_score INTEGER CHECK (maintenance_score >= 1 AND maintenance_score <= 5),
  amenities_score INTEGER CHECK (amenities_score >= 1 AND amenities_score <= 5),
  overall_score DECIMAL(3,2),
  issues_found TEXT[],
  photos TEXT[],
  notes TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Room status history - ประวัติการเปลี่ยนสถานะห้อง
CREATE TABLE room_status_history (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INTEGER REFERENCES users(id),
  reason TEXT,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. User permissions - สิทธิ์การเข้าถึงของผู้ใช้
CREATE TABLE user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(100) NOT NULL,
  resource VARCHAR(100), -- bookings, rooms, users, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission, resource)
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Booking related indexes
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Room and hotel indexes
CREATE INDEX idx_room_types_hotel_id ON room_types(hotel_id);
CREATE INDEX idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX idx_rooms_type_id ON rooms(room_type_id);
CREATE INDEX idx_rooms_status ON rooms(status);

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =========================================
-- SAMPLE DATA
-- =========================================

-- Insert default admin user
INSERT INTO users (first_name, last_name, email, phone, password, role)
VALUES 
  ('Admin', 'Manager', 'admin@royalgarden.com', '0887654321', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  ('Demo', 'User', 'demo@example.com', '0812345678', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user'),
  ('Staff', 'Member', 'staff@hotel.com', '0833334444', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff')
ON CONFLICT (email) DO NOTHING;

-- Insert hotel data
INSERT INTO hotels (name, description, address, city, country, rating, images, amenities)
VALUES (
  'Royal Garden Hotel Bangkok',
  'โรงแรมหรูระดับ 5 ดาว ใจกลางกรุงเทพฯ พร้อมสิ่งอำนวยความสะดวกครบครัน มีประสบการณ์การให้บริการมากกว่า 20 ปี ด้วยการออกแบบที่ผสมผสานระหว่างสถาปัตยกรรมไทยดั้งเดิมและความทันสมัย',
  '123 สาทรใต้ ยานนาวา กรุงเทพฯ 10120',
  'กรุงเทพฯ',
  'ประเทศไทย',
  4.8,
  ARRAY[
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
  ],
  ARRAY[
    'WiFi ฟรี',
    'สระว่ายน้ำ',
    'สปา',
    'ฟิตเนส',
    'ร้านอาหาร',
    'บาร์',
    'รูมเซอร์วิส 24 ชม.',
    'ที่จอดรถฟรี',
    'บริการซักรีด',
    'บริการรับส่งสนามบิน',
    'ห้องประชุม',
    'ลิฟต์',
    'เครื่องปรับอากาศ'
  ]
);

-- Insert room types with comprehensive data
INSERT INTO room_types (hotel_id, name, description, price_per_night, max_guests, size_sqm, amenities, images, type)
VALUES 
  (1, 'Standard Room', 'ห้องพักมาตรฐานขนาด 25 ตรม. พร้อมเตียงคิงไซส์ และวิวเมือง ตกแต่งด้วยโทนสีอบอุ่น เหมาะสำหรับผู้เดินทางคนเดียวหรือคู่รัก', 2500, 2, 25, 
   ARRAY['เครื่องปรับอากาศ', 'ทีวี LED 32"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'เครื่องใช้ไฟฟ้าครบครัน', 'ผ้าปูที่นอนคุณภาพสูง'], 
   ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600'],
   'standard'),
  
  (1, 'Deluxe Room', 'ห้องพักระดับพรีเมียม ขนาด 35 ตรม. พร้อมระเบียงส่วนตัว วิวสวนสวย เฟอร์นิเจอร์ไม้สัก และสิ่งอำนวยความสะดวกระดับพรีเมียม', 3500, 2, 35,
   ARRAY['เครื่องปรับอากาศ', 'ทีวี LED 42"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'เครื่องใช้ไฟฟ้าครบครัน'],
   ARRAY['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'],
   'deluxe'),
  
  (1, 'Junior Suite', 'ห้องสวีทขนาด 50 ตรม. พร้อมห้องนั่งเล่นแยก และวิวสระว่ายน้ำ มีพื้นที่ใช้สอยกว้างขวาง เหมาะสำหรับครอบครัวเล็ก', 5000, 3, 50,
   ARRAY['เครื่องปรับอากาศ', 'ทีวี LED 50"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'ห้องนั่งเล่น', 'โซฟาเบด'],
   ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'],
   'suite'),
  
  (1, 'Executive Suite', 'ห้องสวีทเอ็กเซ็กคิวทีฟ ขนาด 75 ตรม. พร้อมห้องทำงาน วิวเมืองสวยงาม และสิ่งอำนวยความสะดวกระดับบิสซิเนส', 8000, 4, 75,
   ARRAY['เครื่องปรับอากาศ', 'ทีวี LED 55"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'ห้องนั่งเล่น', 'ห้องทำงาน', 'อ่างอาบน้ำจากุซซี่'],
   ARRAY['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600', 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600'],
   'executive'),
  
  (1, 'Presidential Suite', 'ห้องสวีทประธานาธิบดี ขนาด 120 ตรม. ห้องพักระดับโรงแรม 5 ดาวที่สุดหรู พร้อมสิ่งอำนวยความสะดวกครบครันระดับเวิลด์คลาส', 15000, 6, 120,
   ARRAY['เครื่องปรับอากาศ', 'ทีวี LED 65"', 'WiFi ฟรี', 'มินิบาร์', 'ตู้เซฟ', 'โต๊ะทำงาน', 'ระเบียงส่วนตัว', 'เครื่องชงกาแฟ', 'ห้องนั่งเล่น', 'ห้องทำงาน', 'อ่างอาบน้ำจากุซซี่', 'ห้องแต่งตัว', 'ห้องครัวเล็ก'],
   ARRAY['https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=600', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600'],
   'presidential');

-- Insert actual room numbers for each room type
-- Standard Rooms (101-110) - 10 rooms
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
SELECT 1, 1, '10' || generate_series(1,10), 1, 'available';

-- Deluxe Rooms (201-215) - 15 rooms  
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
SELECT 1, 2, CASE WHEN s < 10 THEN '20' || s ELSE '2' || s END, 2, 'available'
FROM generate_series(1,15) s;

-- Junior Suites (301-308) - 8 rooms
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
SELECT 1, 3, '30' || generate_series(1,8), 3, 'available';

-- Executive Suites (401-405) - 5 rooms
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
SELECT 1, 4, '40' || generate_series(1,5), 4, 'available';

-- Presidential Suite (501) - 1 room
INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status)
VALUES (1, 5, '501', 5, 'available');

-- Insert default payment settings
INSERT INTO simple_payment_settings (settings)
VALUES ('{
  "bankName": "ธนาคารกสิกรไทย",
  "accountName": "Royal Garden Hotel Bangkok",
  "accountNumber": "123-456-7890",
  "promptPayId": "0887654321",
  "qrCodeImage": "",
  "isActive": true
}');

INSERT INTO payment_settings (bank_name, account_name, account_number, prompt_pay_id, is_active)
VALUES ('ธนาคารกสิกรไทย', 'Royal Garden Hotel Bangkok', '123-456-7890', '0887654321', true);

-- Initialize room status for all rooms
INSERT INTO room_status (room_id, status, updated_at)
SELECT id, 'available', CURRENT_TIMESTAMP 
FROM room_types;

-- =========================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_room_types_updated_at BEFORE UPDATE ON room_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_room_status_updated_at BEFORE UPDATE ON room_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- SUCCESS MESSAGE
-- =========================================

-- Show final statistics
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'โรงแรมฐานข้อมูลตั้งค่าเรียบร้อยแล้ว!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'ตารางที่สร้าง: % ตาราง', (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  );
  RAISE NOTICE 'ผู้ใช้: % คน', (SELECT COUNT(*) FROM users);
  RAISE NOTICE 'โรงแรม: % แห่ง', (SELECT COUNT(*) FROM hotels);
  RAISE NOTICE 'ประเภทห้อง: % ประเภท', (SELECT COUNT(*) FROM room_types);
  RAISE NOTICE 'ห้องพัก: % ห้อง', (SELECT COUNT(*) FROM rooms);
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'บัญชีผู้ดูแลระบบ:';
  RAISE NOTICE 'อีเมล: admin@royalgarden.com';
  RAISE NOTICE 'รหัสผ่าน: password';
  RAISE NOTICE '==============================================';
END $$;