// Simple script to update admin role using backend's existing SQLite connection
import fs from 'fs';

const createUpdateScript = () => {
  const updateScript = `
-- Update admin user role
UPDATE users SET role = 'admin' WHERE email = 'admin@hotel.com';

-- Verify the update
SELECT id, email, first_name, last_name, role FROM users WHERE email = 'admin@hotel.com';
`;

  fs.writeFileSync('update-admin-role.sql', updateScript);
  console.log('✅ SQL script created: update-admin-role.sql');
  console.log('\n📝 Manual steps:');
  console.log('1. Install SQLite CLI tool if not available');
  console.log('2. Run: sqlite3 backend/src/hotel_booking.db < update-admin-role.sql');
  console.log('\nOr use any SQLite GUI tool to run the SQL commands');
  
  console.log('\n🔍 Alternatively, you can:');
  console.log('1. Open the SQLite database: backend/src/hotel_booking.db');
  console.log('2. Execute: UPDATE users SET role = \'admin\' WHERE email = \'admin@hotel.com\';');
  
  console.log('\n🎯 Admin Login Credentials:');
  console.log('Email: admin@hotel.com');
  console.log('Password: admin123');
  console.log('Role: admin (after update)');
  console.log('\n🌐 Admin Panel: http://localhost:3000/admin');
};

createUpdateScript();