-- Add address and national_id columns to users table (MySQL syntax)
ALTER TABLE users 
ADD COLUMN address TEXT,
ADD COLUMN national_id VARCHAR(17);

-- Create index for national_id for faster searches
CREATE INDEX idx_users_national_id ON users(national_id);

-- Show table structure to verify changes (MySQL)
-- DESCRIBE users;

-- Alternative for SQL Server:
-- ALTER TABLE users ADD address NVARCHAR(MAX);
-- ALTER TABLE users ADD national_id NVARCHAR(17);
-- CREATE INDEX idx_users_national_id ON users(national_id);