// ตรวจสอบผู้ใช้ admin ในระบบ
import { sql } from './src/db/database.js';

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking admin users in database...');
    
    const admins = await sql`
      SELECT id, email, role, first_name, last_name, created_at 
      FROM users 
      WHERE role = 'admin'
    `;
    
    console.log(`📊 Found ${admins.length} admin user(s):`);
    
    if (admins.length === 0) {
      console.log('❌ No admin users found in database!');
      console.log('💡 You need to create an admin user first.');
    } else {
      admins.forEach((admin, index) => {
        console.log(`\n${index + 1}. Admin User:`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   👤 Name: ${admin.first_name || 'N/A'} ${admin.last_name || 'N/A'}`);
        console.log(`   🆔 ID: ${admin.id}`);
        console.log(`   📅 Created: ${admin.created_at}`);
      });
    }
    
    // ตรวจสอบการตั้งค่าอีเมล
    console.log('\n📧 Email configuration:');
    console.log(`   GMAIL_USER: ${process.env.GMAIL_USER || 'Not set'}`);
    console.log(`   GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '****** (Set)' : 'Not set'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
    process.exit(1);
  }
}

checkAdminUsers();