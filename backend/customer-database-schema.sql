-- Customer & Booking Management Database Schema
-- PostgreSQL/MySQL Compatible SQL for Real Customer Data Storage

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS booking_payments CASCADE;
DROP TABLE IF EXISTS customer_bookings CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Create Customers Table (หลังจากชำระเงินแล้ว)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    nationality VARCHAR(50),
    id_card_number VARCHAR(50) UNIQUE,
    passport_number VARCHAR(50) UNIQUE,
    
    -- Address Information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    
    -- Preferences & Status
    preferred_language VARCHAR(10) DEFAULT 'en',
    marketing_consent BOOLEAN DEFAULT false,
    loyalty_points INTEGER DEFAULT 0,
    customer_tier VARCHAR(20) DEFAULT 'bronze' CHECK (customer_tier IN ('bronze', 'silver', 'gold', 'platinum')),
    
    -- System fields
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_customers_email (email),
    INDEX idx_customers_phone (phone),
    INDEX idx_customers_created (created_at)
);

-- Create Payment Methods Table
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('credit_card', 'debit_card', 'bank_transfer', 'e_wallet', 'cash')),
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20), -- visa, mastercard, amex, etc.
    cardholder_name VARCHAR(100),
    expiry_month INTEGER,
    expiry_year INTEGER,
    billing_address_same BOOLEAN DEFAULT true,
    
    -- Security (encrypted/tokenized data only)
    payment_token VARCHAR(255), -- From payment gateway
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_payment_customer (customer_id),
    INDEX idx_payment_type (payment_type)
);

-- Create Customer Bookings Table (รายละเอียดการจอง)
CREATE TABLE customer_bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL, -- BOK001, BOK002, etc.
    customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Hotel & Room Information
    hotel_id INTEGER NOT NULL,
    hotel_name VARCHAR(255) NOT NULL,
    room_id INTEGER,
    room_number VARCHAR(10),
    room_type VARCHAR(100) NOT NULL,
    
    -- Booking Dates
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    nights INTEGER NOT NULL,
    
    -- Guest Information
    adults INTEGER DEFAULT 1,
    children INTEGER DEFAULT 0,
    infants INTEGER DEFAULT 0,
    total_guests INTEGER NOT NULL,
    
    -- Pricing
    room_rate DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    service_fee DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    
    -- Booking Status
    booking_status VARCHAR(20) DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')),
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
    
    -- Additional Information
    special_requests TEXT,
    guest_notes TEXT,
    internal_notes TEXT,
    
    -- Confirmation & Communication
    confirmation_sent BOOLEAN DEFAULT false,
    reminder_sent BOOLEAN DEFAULT false,
    qr_code VARCHAR(255),
    
    -- Timestamps
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    checked_in_at TIMESTAMP,
    checked_out_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (check_out_date > check_in_date),
    CHECK (total_guests > 0),
    CHECK (adults > 0),
    
    -- Indexes
    INDEX idx_bookings_customer (customer_id),
    INDEX idx_bookings_reference (booking_reference),
    INDEX idx_bookings_dates (check_in_date, check_out_date),
    INDEX idx_bookings_status (booking_status),
    INDEX idx_bookings_hotel (hotel_id),
    INDEX idx_bookings_created (created_at)
);

-- Create Booking Payments Table (รายละเอียดการชำระเงิน)
CREATE TABLE booking_payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES customer_bookings(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
    payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
    
    -- Payment Details
    payment_reference VARCHAR(50) UNIQUE NOT NULL, -- PAY001, PAY002, etc.
    transaction_id VARCHAR(100), -- From payment gateway
    gateway_reference VARCHAR(100), -- Payment gateway transaction ID
    
    -- Amount Information
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    
    -- Payment Method Details
    payment_type VARCHAR(20) NOT NULL,
    payment_gateway VARCHAR(50), -- stripe, paypal, omise, etc.
    
    -- Status & Processing
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    failure_reason TEXT,
    
    -- Timing
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    failed_at TIMESTAMP,
    refunded_at TIMESTAMP,
    
    -- Security & Audit
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_payments_booking (booking_id),
    INDEX idx_payments_customer (customer_id),
    INDEX idx_payments_reference (payment_reference),
    INDEX idx_payments_status (payment_status),
    INDEX idx_payments_date (payment_date),
    INDEX idx_payments_gateway (payment_gateway)
);

-- Create Customer Activity Log Table (ประวัติการใช้งาน)
CREATE TABLE customer_activity_log (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- login, booking, payment, update_profile, etc.
    activity_description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_activity_customer (customer_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_activity_date (created_at)
);

-- Create Guest Information Table (สำหรับผู้เข้าพักหลายคน)
CREATE TABLE booking_guests (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES customer_bookings(id) ON DELETE CASCADE,
    guest_type VARCHAR(20) DEFAULT 'adult' CHECK (guest_type IN ('adult', 'child', 'infant')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    id_card_number VARCHAR(50),
    passport_number VARCHAR(50),
    nationality VARCHAR(50),
    special_needs TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_guests_booking (booking_id)
);

-- Insert Sample Data (ตัวอย่างข้อมูลลูกค้าหลังชำระเงิน)

-- Sample Customer (หลังชำระเงินแล้ว)
INSERT INTO customers (
    email, first_name, last_name, phone, nationality, 
    address_line1, city, country, is_verified, loyalty_points, customer_tier
) VALUES 
('john.doe@email.com', 'John', 'Doe', '+66812345678', 'Thai', 
 '123 Sukhumvit Road', 'Bangkok', 'Thailand', true, 100, 'silver'),
 
('jane.smith@email.com', 'Jane', 'Smith', '+66887654321', 'American',
 '456 Silom Road', 'Bangkok', 'Thailand', true, 250, 'gold'),
 
('somchai.thai@email.com', 'Somchai', 'Jaidee', '+66891234567', 'Thai',
 '789 Phahonyothin Road', 'Bangkok', 'Thailand', true, 50, 'bronze');

-- Sample Payment Methods
INSERT INTO payment_methods (
    customer_id, payment_type, card_last_four, card_brand, cardholder_name, is_default
) VALUES 
(1, 'credit_card', '1234', 'visa', 'John Doe', true),
(2, 'credit_card', '5678', 'mastercard', 'Jane Smith', true),
(3, 'bank_transfer', NULL, NULL, NULL, true);

-- Sample Bookings (หลังชำระเงินแล้ว)
INSERT INTO customer_bookings (
    booking_reference, customer_id, hotel_id, hotel_name, room_type,
    check_in_date, check_out_date, nights, adults, children, total_guests,
    room_rate, subtotal, tax_amount, service_fee, total_amount,
    booking_status, payment_status, special_requests
) VALUES 
('BOK001', 1, 1, 'Royal Palace Bangkok', 'Deluxe Room',
 '2025-10-01', '2025-10-03', 2, 2, 0, 2,
 2500.00, 5000.00, 350.00, 100.00, 5450.00,
 'confirmed', 'paid', 'Late check-in requested'),
 
('BOK002', 2, 2, 'Paradise Beach Resort', 'Beach View Room',
 '2025-10-15', '2025-10-18', 3, 2, 1, 3,
 2800.00, 8400.00, 588.00, 100.00, 9088.00,
 'confirmed', 'paid', 'Baby cot needed'),
 
('BOK003', 3, 1, 'Royal Palace Bangkok', 'Standard Room',
 '2025-11-01', '2025-11-02', 1, 1, 0, 1,
 1500.00, 1500.00, 105.00, 100.00, 1705.00,
 'confirmed', 'paid', NULL);

-- Sample Payments
INSERT INTO booking_payments (
    booking_id, customer_id, payment_method_id, payment_reference,
    transaction_id, amount, payment_type, payment_gateway, payment_status
) VALUES 
(1, 1, 1, 'PAY001', 'TXN123456789', 5450.00, 'credit_card', 'stripe', 'completed'),
(2, 2, 2, 'PAY002', 'TXN987654321', 9088.00, 'credit_card', 'omise', 'completed'),
(3, 3, 3, 'PAY003', 'TXN456789123', 1705.00, 'bank_transfer', 'bank', 'completed');

-- Sample Guest Information
INSERT INTO booking_guests (
    booking_id, guest_type, first_name, last_name, nationality
) VALUES 
(1, 'adult', 'John', 'Doe', 'Thai'),
(1, 'adult', 'Mary', 'Doe', 'Thai'),
(2, 'adult', 'Jane', 'Smith', 'American'),
(2, 'adult', 'Robert', 'Smith', 'American'),
(2, 'child', 'Emily', 'Smith', 'American'),
(3, 'adult', 'Somchai', 'Jaidee', 'Thai');

-- Create Views for Easy Data Access

-- Customer Summary View
CREATE VIEW customer_summary AS
SELECT 
    c.id,
    c.email,
    CONCAT(c.first_name, ' ', c.last_name) as full_name,
    c.phone,
    c.customer_tier,
    c.loyalty_points,
    COUNT(cb.id) as total_bookings,
    SUM(cb.total_amount) as total_spent,
    MAX(cb.booking_date) as last_booking_date
FROM customers c
LEFT JOIN customer_bookings cb ON c.id = cb.customer_id
WHERE c.is_verified = true
GROUP BY c.id, c.email, c.first_name, c.last_name, c.phone, c.customer_tier, c.loyalty_points;

-- Active Bookings View
CREATE VIEW active_bookings AS
SELECT 
    cb.booking_reference,
    CONCAT(c.first_name, ' ', c.last_name) as customer_name,
    c.email,
    c.phone,
    cb.hotel_name,
    cb.room_type,
    cb.check_in_date,
    cb.check_out_date,
    cb.total_guests,
    cb.total_amount,
    cb.booking_status,
    cb.payment_status
FROM customer_bookings cb
JOIN customers c ON cb.customer_id = c.id
WHERE cb.booking_status IN ('confirmed', 'checked_in')
AND cb.check_out_date >= CURRENT_DATE
ORDER BY cb.check_in_date;

-- Payment History View
CREATE VIEW payment_history AS
SELECT 
    bp.payment_reference,
    cb.booking_reference,
    CONCAT(c.first_name, ' ', c.last_name) as customer_name,
    bp.amount,
    bp.currency,
    bp.payment_type,
    bp.payment_gateway,
    bp.payment_status,
    bp.payment_date
FROM booking_payments bp
JOIN customer_bookings cb ON bp.booking_id = cb.id
JOIN customers c ON bp.customer_id = c.id
ORDER BY bp.payment_date DESC;

COMMIT;

-- Display summary
SELECT 'Database Setup Complete!' as status;
SELECT 'Tables Created:' as info, 'customers, payment_methods, customer_bookings, booking_payments, customer_activity_log, booking_guests' as tables;
SELECT 'Sample Data:' as info, '3 customers, 3 bookings, 3 payments' as data;