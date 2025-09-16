-- Add payment tables to existing hotel_booking database
USE hotel_booking;

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
INSERT IGNORE INTO payment_settings (setting_key, setting_value, description) VALUES
('qr_code_url', '/uploads/qr-code.jpg', 'QR Code image path for payments'),
('bank_name', 'ธนาคารกสิกรไทย', 'Bank name for payments'),
('bank_account', '123-456-7890', 'Bank account number'),
('account_name', 'Hotel Booking System', 'Account holder name');

-- Sample payment slips
INSERT IGNORE INTO payment_slips (id, booking_id, user_id, file_name, original_name, file_path, file_size, amount, status) VALUES
(1, 1, 4, 'slip_001.jpg', 'payment_receipt.jpg', '/uploads/payment-slips/slip_001.jpg', 245760, 5000.00, 'approved'),
(2, 2, 5, 'slip_002.jpg', 'transfer_proof.jpg', '/uploads/payment-slips/slip_002.jpg', 189432, 3600.00, 'pending');

SELECT 'Payment tables added successfully!' as Status;