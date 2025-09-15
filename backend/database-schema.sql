-- Hotel Booking System Database Schema
-- PostgreSQL Database for Neon

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS global_settings CASCADE;

-- Create Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Hotels Table
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    amenities TEXT[], -- PostgreSQL array for amenities
    image_url VARCHAR(500),
    rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_rooms INTEGER DEFAULT 0,
    avg_price DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Rooms Table
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    room_number VARCHAR(10) NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    max_occupancy INTEGER DEFAULT 2,
    amenities TEXT[],
    description TEXT,
    image_url VARCHAR(500),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, room_number)
);

-- Create Bookings Table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests INTEGER DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    special_requests TEXT,
    qr_code VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (check_out_date > check_in_date)
);

-- Create Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read_status BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Global Settings Table
CREATE TABLE global_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX idx_rooms_available ON rooms(is_available);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read_status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Insert Sample Data

-- Insert sample hotels
INSERT INTO hotels (name, description, location, amenities, image_url, rating, total_rooms, avg_price) VALUES 
('Royal Palace Bangkok', 'Luxury 5-star hotel in downtown Bangkok', 'Bangkok, Thailand', 
 ARRAY['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant'], 
 'https://images.unsplash.com/photo-1566073771259-6a8506099945', 4.8, 200, 2500.00),
 
('Paradise Beach Resort', 'Beachfront resort with private beach access', 'Phuket, Thailand',
 ARRAY['Beach Access', 'Pool', 'Water Sports', 'Bar', 'WiFi'],
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4', 4.9, 150, 3200.00),

('Mountain View Lodge', 'Cozy lodge with mountain views', 'Chiang Mai, Thailand',
 ARRAY['Mountain View', 'Hiking', 'WiFi', 'Restaurant', 'Fireplace'],
 'https://images.unsplash.com/photo-1571896349842-33c89424de2d', 4.6, 80, 1800.00);

-- Insert sample rooms
INSERT INTO rooms (hotel_id, room_number, room_type, price_per_night, max_occupancy, amenities, description) VALUES 
-- Royal Palace Bangkok rooms
(1, '101', 'Standard Room', 1500.00, 2, ARRAY['WiFi', 'Air Conditioning', 'TV'], 'Comfortable standard room with city view'),
(1, '102', 'Standard Room', 1500.00, 2, ARRAY['WiFi', 'Air Conditioning', 'TV'], 'Comfortable standard room with city view'),
(1, '201', 'Deluxe Room', 2500.00, 2, ARRAY['WiFi', 'Air Conditioning', 'TV', 'Minibar'], 'Spacious deluxe room with premium amenities'),
(1, '301', 'Suite', 4000.00, 4, ARRAY['WiFi', 'Air Conditioning', 'TV', 'Minibar', 'Living Area'], 'Luxury suite with separate living area'),

-- Paradise Beach Resort rooms
(2, 'B101', 'Beach View Room', 2800.00, 2, ARRAY['WiFi', 'Air Conditioning', 'TV', 'Beach View'], 'Room with direct beach view'),
(2, 'B102', 'Beach View Room', 2800.00, 2, ARRAY['WiFi', 'Air Conditioning', 'TV', 'Beach View'], 'Room with direct beach view'),
(2, 'V201', 'Villa', 5000.00, 4, ARRAY['WiFi', 'Air Conditioning', 'TV', 'Private Pool', 'Kitchen'], 'Private villa with pool'),

-- Mountain View Lodge rooms
(3, 'M101', 'Mountain View Room', 1200.00, 2, ARRAY['WiFi', 'Heating', 'TV', 'Mountain View'], 'Cozy room with mountain view'),
(3, 'M102', 'Mountain View Room', 1200.00, 2, ARRAY['WiFi', 'Heating', 'TV', 'Mountain View'], 'Cozy room with mountain view');

-- Insert sample admin user (password: admin123 - hashed)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) VALUES 
('admin@hotel.com', '$2b$10$8K4zYkQeKkh1DH1KqW0KUeC.Yz.8zF4K3H2Z1G9F5M0N7X2V4L8B6', 'Admin', 'User', 'admin', true),
('staff@hotel.com', '$2b$10$8K4zYkQeKkh1DH1KqW0KUeC.Yz.8zF4K3H2Z1G9F5M0N7X2V4L8B6', 'Staff', 'User', 'staff', true),
('customer@email.com', '$2b$10$8K4zYkQeKkh1DH1KqW0KUeC.Yz.8zF4K3H2Z1G9F5M0N7X2V4L8B6', 'John', 'Doe', 'customer', true);

-- Insert sample global settings
INSERT INTO global_settings (setting_key, setting_value, setting_type, description) VALUES 
('room_price_per_night', '1500', 'number', 'Default room price per night in THB'),
('currency', 'THB', 'string', 'Default currency for the system'),
('max_booking_days', '365', 'number', 'Maximum days in advance for booking'),
('cancellation_hours', '24', 'number', 'Hours before check-in to allow free cancellation'),
('tax_rate', '7', 'number', 'Tax rate percentage'),
('service_fee', '100', 'number', 'Service fee in THB');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type) VALUES 
(NULL, 'System Online', 'Hotel booking system is now online and ready', 'success'),
(NULL, 'Database Connected', 'Successfully connected to PostgreSQL database', 'info'),
(3, 'Welcome!', 'Welcome to our hotel booking system', 'info');

COMMIT;

-- Display table information
SELECT 'Hotels' as table_name, COUNT(*) as record_count FROM hotels
UNION ALL
SELECT 'Rooms' as table_name, COUNT(*) as record_count FROM rooms
UNION ALL
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Global Settings' as table_name, COUNT(*) as record_count FROM global_settings
UNION ALL
SELECT 'Notifications' as table_name, COUNT(*) as record_count FROM notifications;