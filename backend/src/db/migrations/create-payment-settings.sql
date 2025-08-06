-- Create payment_settings table
CREATE TABLE IF NOT EXISTS payment_settings (
    id SERIAL PRIMARY KEY,
    qr_code_url TEXT,
    bank_name VARCHAR(255) NOT NULL DEFAULT 'ธนาคาร',
    account_number VARCHAR(50) NOT NULL DEFAULT '',
    account_name VARCHAR(255) NOT NULL DEFAULT '',
    qr_code_filename VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default record if not exists
INSERT INTO payment_settings (bank_name, account_number, account_name)
SELECT 'ธนาคารทดสอบ', '123-456-789', 'Hotel Account'
WHERE NOT EXISTS (SELECT 1 FROM payment_settings LIMIT 1);
