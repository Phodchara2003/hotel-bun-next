-- MySQL Database Schema for Hotel Booking System
-- Run this script in phpMyAdmin or MySQL command line

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS hotel_booking 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE hotel_booking;

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    rating DECIMAL(3,2) DEFAULT 0.00,
    images JSON,
    amenities JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Room types table
CREATE TABLE IF NOT EXISTS room_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_night DECIMAL(10,2) NOT NULL,
    max_guests INT DEFAULT 2,
    size_sqm INT,
    amenities JSON,
    images JSON,
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    room_type_id INT NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    floor INT,
    status ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room (hotel_id, room_number)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role ENUM('guest', 'staff', 'admin') DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    hotel_id INT NOT NULL,
    room_type_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests INT DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
    booking_reference VARCHAR(20) UNIQUE,
    guest_name VARCHAR(255),
    guest_phone VARCHAR(20),
    guest_email VARCHAR(255),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
);

-- Sample data
INSERT INTO hotels (name, description, address, city, country, rating, images, amenities) VALUES
('Grand Hotel Bangkok', 'Luxury hotel in the heart of Bangkok with world-class amenities', '123 Sukhumvit Road, Watthana', 'Bangkok', 'Thailand', 4.8, 
 '["hotel1.jpg", "hotel1-2.jpg"]',
 '["WiFi", "Pool", "Restaurant", "Spa", "Gym", "Conference Room"]'),

('Riverside Resort Chiang Mai', 'Beautiful riverside resort with mountain views and traditional Thai architecture', '456 River Valley Road, Mae Rim', 'Chiang Mai', 'Thailand', 4.6,
 '["hotel2.jpg", "hotel2-2.jpg"]', 
 '["WiFi", "Pool", "Restaurant", "Kayaking", "Mountain View", "Traditional Spa"]'),

('Beachfront Paradise Phuket', 'Stunning beachfront resort with direct beach access and sunset views', '789 Beach Road, Patong', 'Phuket', 'Thailand', 4.9,
 '["hotel3.jpg", "hotel3-2.jpg"]',
 '["WiFi", "Pool", "Restaurant", "Beach Access", "Water Sports", "Sunset Bar"]');

INSERT INTO room_types (hotel_id, name, description, price_per_night, max_guests, size_sqm, amenities, images, type) VALUES
-- Grand Hotel Bangkok rooms
(1, 'Deluxe City View', 'Spacious deluxe room with panoramic city view and modern amenities', 2500.00, 2, 35, 
 '["WiFi", "AC", "TV", "Minibar", "Safe", "City View"]', 
 '["room1.jpg"]', 'deluxe'),

(1, 'Superior Room', 'Comfortable superior room with modern amenities and partial city view', 1800.00, 2, 28,
 '["WiFi", "AC", "TV", "Minibar", "Work Desk"]',
 '["room2.jpg"]', 'superior'),

(1, 'Executive Suite', 'Luxurious executive suite with separate living area and premium amenities', 4500.00, 4, 60,
 '["WiFi", "AC", "TV", "Minibar", "Safe", "Living Area", "Premium Bathroom"]',
 '["suite1.jpg"]', 'suite'),

-- Riverside Resort rooms
(2, 'Garden View Room', 'Peaceful room overlooking tropical gardens with traditional Thai decor', 2200.00, 2, 32,
 '["WiFi", "AC", "TV", "Minibar", "Garden View", "Traditional Decor"]',
 '["room3.jpg"]', 'standard'),

(2, 'Riverside Villa', 'Private villa with direct river access and outdoor terrace', 3800.00, 4, 55,
 '["WiFi", "AC", "TV", "Minibar", "River View", "Private Terrace", "Outdoor Bath"]',
 '["villa1.jpg"]', 'villa'),

-- Beachfront Paradise rooms
(3, 'Ocean View Room', 'Beautiful room with direct ocean view and beach access', 3200.00, 2, 38,
 '["WiFi", "AC", "TV", "Minibar", "Ocean View", "Beach Access"]',
 '["room4.jpg"]', 'standard'),

(3, 'Beachfront Suite', 'Luxury suite with private beach access and infinity pool view', 5500.00, 4, 70,
 '["WiFi", "AC", "TV", "Minibar", "Safe", "Beach Access", "Pool View", "Jacuzzi"]',
 '["suite2.jpg"]', 'suite');

INSERT INTO rooms (hotel_id, room_type_id, room_number, floor, status) VALUES
-- Grand Hotel Bangkok (Hotel ID: 1)
(1, 1, '101', 1, 'available'),
(1, 1, '102', 1, 'available'), 
(1, 1, '201', 2, 'occupied'),
(1, 1, '202', 2, 'available'),
(1, 2, '103', 1, 'available'),
(1, 2, '104', 1, 'maintenance'),
(1, 2, '203', 2, 'available'),
(1, 3, '301', 3, 'available'),

-- Riverside Resort (Hotel ID: 2)
(2, 4, '1', 1, 'available'),
(2, 4, '2', 1, 'occupied'),
(2, 4, '3', 1, 'available'),
(2, 5, '10', 1, 'available'),
(2, 5, '11', 1, 'reserved'),

-- Beachfront Paradise (Hotel ID: 3)
(3, 6, 'A1', 1, 'available'),
(3, 6, 'A2', 1, 'available'),
(3, 6, 'B1', 2, 'occupied'),
(3, 7, 'S1', 1, 'available'),
(3, 7, 'S2', 1, 'available');

INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES
('admin@hotel.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', '0800000000', 'admin'),
('staff@hotel.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff', 'Member', '0800000001', 'staff'),
('user@hotel.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', '0812345678', 'guest'),
('somchai@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สมชาย', 'ใจดี', '0812345678', 'guest'),
('suda@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'สุดา', 'ยิ้มแย้ม', '0897654321', 'guest');

INSERT INTO bookings (user_id, hotel_id, room_type_id, check_in_date, check_out_date, guests, total_price, status, booking_reference, guest_name, guest_phone, guest_email) VALUES
(4, 1, 1, '2024-12-20', '2024-12-22', 2, 5000.00, 'confirmed', 'HTL001', 'สมชาย ใจดี', '0812345678', 'somchai@example.com'),
(5, 1, 2, '2024-12-25', '2024-12-27', 1, 3600.00, 'pending', 'HTL002', 'สุดา ยิ้มแย้ม', '0897654321', 'suda@example.com'),
(3, 2, 4, '2025-01-10', '2025-01-13', 2, 6600.00, 'confirmed', 'HTL003', 'John Doe', '0812345678', 'user@hotel.com'),
(4, 3, 6, '2025-01-15', '2025-01-18', 2, 9600.00, 'pending', 'HTL004', 'สมชาย ใจดี', '0812345678', 'somchai@example.com');

-- Payment slips table
CREATE TABLE IF NOT EXISTS payment_slips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    user_id INT,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    amount DECIMAL(10,2),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Payment settings table
CREATE TABLE IF NOT EXISTS payment_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default payment settings
INSERT INTO payment_settings (setting_key, setting_value, description) VALUES
('qr_code_url', '/uploads/qr-code.jpg', 'QR Code image path for payments'),
('bank_name', 'ธนาคารกสิกรไทย', 'Bank name for payments'),
('bank_account', '123-456-7890', 'Bank account number'),
('account_name', 'Hotel Booking System', 'Account holder name');

-- Sample payment slips
INSERT INTO payment_slips (booking_id, user_id, file_name, original_name, file_path, file_size, amount, status) VALUES
(1, 4, 'slip_001.jpg', 'payment_receipt.jpg', '/uploads/payment-slips/slip_001.jpg', 245760, 5000.00, 'approved'),
(2, 5, 'slip_002.jpg', 'transfer_proof.jpg', '/uploads/payment-slips/slip_002.jpg', 189432, 3600.00, 'pending');

-- Show success message
SELECT 'Hotel booking database created successfully!' as Status;
SELECT COUNT(*) as Hotels FROM hotels;
SELECT COUNT(*) as RoomTypes FROM room_types;
SELECT COUNT(*) as Rooms FROM rooms;
SELECT COUNT(*) as Users FROM users;
SELECT COUNT(*) as Bookings FROM bookings;
SELECT COUNT(*) as PaymentSlips FROM payment_slips;
SELECT COUNT(*) as PaymentSettings FROM payment_settings;