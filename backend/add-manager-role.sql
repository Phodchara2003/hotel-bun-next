-- Add manager role to existing users table
ALTER TABLE users MODIFY COLUMN role ENUM('guest', 'staff', 'manager', 'admin') DEFAULT 'guest';