// Update user role to admin in SQLite database
import { Database } from 'bun:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to SQLite database
const dbPath = path.join(__dirname, 'backend', 'src', 'hotel_booking.db');
const db = new Database(dbPath);

console.log('🔍 Connecting to SQLite database:', dbPath);

try {
  // Check if admin user exists
  const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@hotel.com');
  
  if (!adminUser) {
    console.log('❌ Admin user not found in SQLite database');
    console.log('💡 The user might be in the PostgreSQL database instead');
    process.exit(1);
  }
  
  console.log('👤 Found user:', {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    name: `${adminUser.first_name} ${adminUser.last_name}`
  });
  
  if (adminUser.role === 'admin') {
    console.log('✅ User already has admin role!');
  } else {
    // Update user role to admin
    console.log('🔄 Updating user role to admin...');
    const updateStmt = db.prepare('UPDATE users SET role = ? WHERE email = ?');
    const result = updateStmt.run('admin', 'admin@hotel.com');
    
    if (result.changes > 0) {
      console.log('✅ User role updated to admin successfully!');
      
      // Verify update
      const updatedUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@hotel.com');
      console.log('🎉 Updated user:', {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`
      });
    } else {
      console.log('❌ Failed to update user role');
    }
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}

console.log('\n🎯 Admin Login Credentials:');
console.log('Email: admin@hotel.com');
console.log('Password: admin123');
console.log('Role: admin');
console.log('\n🌐 Admin Panel: http://localhost:3000/admin');