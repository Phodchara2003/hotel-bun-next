// แสดงรายชื่อผู้ใช้ทั้งหมดจากฐานข้อมูลโดยตรง
const postgres = require('postgres');
require('dotenv').config();

// ตั้งค่าการเชื่อมต่อฐานข้อมูล
const sql = postgres(process.env.DATABASE_URL || 'postgresql://localhost/hotel_db', { 
  ssl: false,
  transform: postgres.camel
});

async function listAllUsers() {
  try {
    console.log('👥 รายชื่อผู้ใช้ทั้งหมดในระบบ');
    console.log('=' * 60);

    // ดึงข้อมูลผู้ใช้ทั้งหมด
    const users = await sql`
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        phone, 
        role, 
        created_at,
        updated_at
      FROM users 
      ORDER BY role, created_at DESC
    `;

    if (users.length === 0) {
      console.log('❌ ไม่พบผู้ใช้ในระบบ');
      return;
    }

    console.log(`📊 พบผู้ใช้ทั้งหมด ${users.length} คน\n`);

    // จัดกลุ่มตามบทบาท
    const usersByRole = {};
    users.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    // แสดงผลตามบทบาท
    const roleNames = {
      'admin': '👑 ผู้ดูแลระบบ (Admin)',
      'staff': '👨‍💼 พนักงาน (Staff)', 
      'user': '👤 ลูกค้า (User)',
      'super_admin': '🔱 ผู้ดูแลระบบสูงสุด (Super Admin)'
    };

    const roleOrder = ['super_admin', 'admin', 'staff', 'user'];

    roleOrder.forEach(role => {
      if (usersByRole[role]) {
        console.log(`\n${roleNames[role] || role.toUpperCase()}`);
        console.log('-'.repeat(50));
        
        usersByRole[role].forEach((user, index) => {
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
          const phone = user.phone || 'ไม่ระบุ';
          const createdDate = new Date(user.createdAt).toLocaleString('th-TH');
          
          console.log(`${index + 1}. ID: ${user.id}`);
          console.log(`   📧 อีเมล: ${user.email}`);
          console.log(`   👤 ชื่อ: ${fullName}`);
          console.log(`   📱 เบอร์: ${phone}`);
          console.log(`   📅 สร้างเมื่อ: ${createdDate}`);
          console.log('');
        });
      }
    });

    // สถิติสรุป
    console.log('\n📈 สถิติผู้ใช้');
    console.log('-'.repeat(30));
    Object.keys(roleNames).forEach(role => {
      const count = usersByRole[role]?.length || 0;
      if (count > 0) {
        console.log(`${roleNames[role]}: ${count} คน`);
      }
    });

    // ผู้ใช้ทดสอบ
    console.log('\n🧪 ผู้ใช้ทดสอบ');
    console.log('-'.repeat(20));
    const testUsers = users.filter(user => 
      user.email.includes('@hotel.com')
    );

    if (testUsers.length > 0) {
      testUsers.forEach(user => {
        const roleIcon = {
          'admin': '👑',
          'staff': '👨‍💼', 
          'user': '👤'
        };
        console.log(`${roleIcon[user.role] || '❓'} ${user.email} (${user.role})`);
      });
    } else {
      console.log('ไม่พบผู้ใช้ทดสอบ');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ แสดงรายชื่อผู้ใช้ทั้งหมดเสร็จสิ้น');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    console.error('Stack:', error.stack);
  }

  process.exit(0);
}

listAllUsers();
