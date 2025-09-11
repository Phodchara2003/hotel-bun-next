// แสดงรายชื่อผู้ใช้ทั้งหมดในระบบ
import { sql } from './backend/src/db/database.js';

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
        console.log('-' * 50);
        
        usersByRole[role].forEach((user, index) => {
          const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
          const phone = user.phone || 'ไม่ระบุ';
          const createdDate = new Date(user.created_at).toLocaleString('th-TH');
          
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
    console.log('-' * 30);
    Object.keys(roleNames).forEach(role => {
      const count = usersByRole[role]?.length || 0;
      if (count > 0) {
        console.log(`${roleNames[role]}: ${count} คน`);
      }
    });

    // แสดงผู้ใช้ที่เพิ่งสร้างล่าสุด
    console.log('\n🆕 ผู้ใช้ที่เพิ่งสร้างล่าสุด (5 คนแรก)');
    console.log('-' * 40);
    const recentUsers = users.slice(0, 5);
    recentUsers.forEach((user, index) => {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'ไม่ระบุชื่อ';
      const createdDate = new Date(user.created_at).toLocaleString('th-TH');
      const roleIcon = {
        'admin': '👑',
        'staff': '👨‍💼',
        'user': '👤',
        'super_admin': '🔱'
      };
      
      console.log(`${index + 1}. ${roleIcon[user.role] || '❓'} ${fullName} (${user.email})`);
      console.log(`   บทบาท: ${user.role} | สร้างเมื่อ: ${createdDate}`);
      console.log('');
    });

    // ผู้ใช้ที่ใช้สำหรับทดสอบ
    console.log('\n🧪 ผู้ใช้ทดสอบ');
    console.log('-' * 20);
    const testUsers = users.filter(user => 
      user.email.includes('@hotel.com') || 
      ['admin123', 'user123', 'staff123'].some(password => user.email.includes('admin@') || user.email.includes('user@') || user.email.includes('staff@'))
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

    console.log('\n' + '=' * 60);
    console.log('✅ แสดงรายชื่อผู้ใช้ทั้งหมดเสร็จสิ้น');

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
  }

  process.exit(0);
}

listAllUsers();
