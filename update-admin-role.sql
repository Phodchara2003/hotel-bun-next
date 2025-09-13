
-- Update admin user role
UPDATE users SET role = 'admin' WHERE email = 'admin@hotel.com';

-- Verify the update
SELECT id, email, first_name, last_name, role FROM users WHERE email = 'admin@hotel.com';
