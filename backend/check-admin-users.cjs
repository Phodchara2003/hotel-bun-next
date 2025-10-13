/**
 * ตรวจสอบผู้ใช้แอดมินในฐานข้อมูล
 */

const mysql = require('mysql2/promise');

// MySQL Connection Configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

async function checkAdminUsers() {
  let connection = null;
  
  try {
    console.log('🔍 เชื่อมต่อกับฐานข้อมูล...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📊 ตรวจสอบผู้ใช้แอดมินในระบบ...');
    
    // ตรวจสอบผู้ใช้ทั้งหมด
    const [allUsers] = await connection.execute(`
      SELECT id, email, first_name, last_name, role, created_at 
      FROM users 
      ORDER BY role, created_at DESC
    `);
    
    console.log(`\n👥 ผู้ใช้ทั้งหมดในระบบ: ${allUsers.length} คน`);
    console.log('='.repeat(80));
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name || 'ไม่ระบุ'} ${user.last_name || 'ไม่ระบุ'} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log('');
    });
    
    // ตรวจสอบผู้ใช้แอดมิน
    const [adminUsers] = await connection.execute(`
      SELECT id, email, first_name, last_name, role, created_at 
      FROM users 
      WHERE role IN ('admin', 'manager') 
      ORDER BY created_at DESC
    `);
    
    console.log(`\n🛡️ ผู้ใช้แอดมิน/ผู้จัดการ: ${adminUsers.length} คน`);
    console.log('='.repeat(50));
    if (adminUsers.length > 0) {
      adminUsers.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.first_name || 'ไม่ระบุ'} ${admin.last_name || 'ไม่ระบุ'}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log('');
      });
    } else {
      console.log('❌ ไม่พบผู้ใช้แอดมินในระบบ!');
    }
    
    // ตรวจสอบผู้ใช้แอดมินที่สามารถรับอีเมลได้
    const [emailableAdmins] = await connection.execute(`
      SELECT id, email, first_name, last_name, role 
      FROM users 
      WHERE role IN ('admin', 'manager') 
      AND email IS NOT NULL
    `);
    
    console.log(`\n📧 ผู้ใช้แอดมินที่สามารถรับอีเมลได้: ${emailableAdmins.length} คน`);
    console.log('='.repeat(60));
    if (emailableAdmins.length > 0) {
      emailableAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.first_name || 'ไม่ระบุ'} ${admin.last_name || 'ไม่ระบุ'} (${admin.email})`);
      });
      console.log('\n✅ พร้อมส่งอีเมลแจ้งเตือนให้แอดมินเหล่านี้!');
    } else {
      console.log('⚠️ ไม่พบผู้ใช้แอดมินที่สามารถรับอีเมลได้!');
      console.log('\n💡 แนะนำ:');
      console.log('1. สร้างผู้ใช้แอดมินใหม่');
      console.log('2. หรือแก้ไข role ของผู้ใช้ที่มีอยู่เป็น admin/manager');
      console.log('3. ตรวจสอบว่าผู้ใช้มีอีเมล');
    }
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔚 ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
    }
  }
}

// เรียกใช้ฟังก์ชัน
checkAdminUsers();