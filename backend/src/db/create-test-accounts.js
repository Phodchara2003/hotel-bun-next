import { Database } from 'bun:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create SQLite database connection
const dbPath = path.join(__dirname, '..', 'hotel_booking.db');
const db = new Database(dbPath);

console.log('🔧 Creating test accounts...');

async function createTestAccounts() {
  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const userPassword = await bcrypt.hash('user123', 12);

    // Check if admin account exists
    const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@hotel.com');
    
    if (!adminExists) {
      const insertAdmin = db.prepare(`
        INSERT INTO users (email, password, first_name, last_name, phone, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
      
      insertAdmin.run(
        'admin@hotel.com',
        adminPassword,
        'ระบบ',
        'แอดมิน',
        '0812345678',
        'admin'
      );
      
      console.log('✅ Admin account created');
      console.log('   📧 Email: admin@hotel.com');
      console.log('   🔑 Password: admin123');
    } else {
      console.log('ℹ️ Admin account already exists');
    }

    // Check if user account exists
    const userExists = db.prepare('SELECT id FROM users WHERE email = ?').get('user@hotel.com');
    
    if (!userExists) {
      const insertUser = db.prepare(`
        INSERT INTO users (email, password, first_name, last_name, phone, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
      
      insertUser.run(
        'user@hotel.com',
        userPassword,
        'ลูกค้า',
        'ทดสอบ',
        '0887654321',
        'user'
      );
      
      console.log('✅ User account created');
      console.log('   📧 Email: user@hotel.com');
      console.log('   🔑 Password: user123');
    } else {
      console.log('ℹ️ User account already exists');
    }

    // Check if staff account exists (bonus)
    const staffExists = db.prepare('SELECT id FROM users WHERE email = ?').get('staff@hotel.com');
    
    if (!staffExists) {
      const staffPassword = await bcrypt.hash('staff123', 12);
      const insertStaff = db.prepare(`
        INSERT INTO users (email, password, first_name, last_name, phone, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
      
      insertStaff.run(
        'staff@hotel.com',
        staffPassword,
        'พนักงาน',
        'ทดสอบ',
        '0898765432',
        'staff'
      );
      
      console.log('✅ Staff account created');
      console.log('   📧 Email: staff@hotel.com');
      console.log('   🔑 Password: staff123');
    } else {
      console.log('ℹ️ Staff account already exists');
    }

    // Display all test accounts
    console.log('\n📋 Test Accounts Summary:');
    console.log('┌──────────────────────────────────────────────────────┐');
    console.log('│                  🧪 Test Accounts                   │');
    console.log('├──────────────────────────────────────────────────────┤');
    console.log('│ 👨‍💼 Admin:  admin@hotel.com  | admin123           │');
    console.log('│ 👤 User:   user@hotel.com   | user123            │');
    console.log('│ 👷 Staff:  staff@hotel.com  | staff123           │');
    console.log('└──────────────────────────────────────────────────────┘');

    // Verify accounts
    const allTestUsers = db.prepare(`
      SELECT email, role, first_name, last_name, created_at 
      FROM users 
      WHERE email IN ('admin@hotel.com', 'user@hotel.com', 'staff@hotel.com')
      ORDER BY role DESC
    `).all();

    console.log('\n✅ Verification:');
    allTestUsers.forEach(user => {
      const roleIcon = user.role === 'admin' ? '👨‍💼' : user.role === 'staff' ? '👷' : '👤';
      console.log(`   ${roleIcon} ${user.first_name} ${user.last_name} (${user.email}) - ${user.role}`);
    });

    console.log('\n🎉 Test accounts setup completed!');
    console.log('💡 You can now login with these accounts on the frontend.');
    
  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
  } finally {
    db.close();
  }
}

createTestAccounts();
