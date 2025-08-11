import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

console.log('Creating permission system tables...');

try {
  // สร้างตาราง permissions
  await sql`
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      category VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  console.log('✅ Created permissions table');

  // สร้างตาราง user_permissions
  await sql`
    CREATE TABLE IF NOT EXISTS user_permissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
      granted_by INTEGER REFERENCES users(id),
      granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, permission_id)
    )
  `;
  console.log('✅ Created user_permissions table');

  // เพิ่มสิทธิ์พื้นฐาน
  const defaultPermissions = [
    // การจัดการห้องพัก
    { name: 'rooms_view', description: 'ดูข้อมูลห้องพัก', category: 'rooms' },
    { name: 'rooms_create', description: 'เพิ่มห้องพักใหม่', category: 'rooms' },
    { name: 'rooms_edit', description: 'แก้ไขข้อมูลห้องพัก', category: 'rooms' },
    { name: 'rooms_delete', description: 'ลบห้องพัก', category: 'rooms' },
    { name: 'rooms_manage_status', description: 'จัดการสถานะห้องพัก', category: 'rooms' },
    
    // การจัดการการจอง
    { name: 'bookings_view', description: 'ดูข้อมูลการจอง', category: 'bookings' },
    { name: 'bookings_create', description: 'สร้างการจองใหม่', category: 'bookings' },
    { name: 'bookings_edit', description: 'แก้ไขการจอง', category: 'bookings' },
    { name: 'bookings_cancel', description: 'ยกเลิกการจอง', category: 'bookings' },
    { name: 'bookings_confirm', description: 'ยืนยันการจอง', category: 'bookings' },
    
    // การจัดการผู้ใช้
    { name: 'users_view', description: 'ดูข้อมูลผู้ใช้', category: 'users' },
    { name: 'users_edit', description: 'แก้ไขข้อมูลผู้ใช้', category: 'users' },
    { name: 'users_delete', description: 'ลบผู้ใช้', category: 'users' },
    { name: 'users_manage_permissions', description: 'จัดการสิทธิ์ผู้ใช้', category: 'users' },
    
    // รายงานและการเงิน
    { name: 'reports_view', description: 'ดูรายงาน', category: 'reports' },
    { name: 'reports_export', description: 'ส่งออกรายงาน', category: 'reports' },
    { name: 'payments_view', description: 'ดูข้อมูลการชำระเงิน', category: 'payments' },
    { name: 'payments_manage', description: 'จัดการการชำระเงิน', category: 'payments' },
    
    // การตั้งค่าระบบ
    { name: 'settings_view', description: 'ดูการตั้งค่าระบบ', category: 'settings' },
    { name: 'settings_edit', description: 'แก้ไขการตั้งค่าระบบ', category: 'settings' },
    
    // การจัดการการแจ้งเตือน
    { name: 'notifications_view', description: 'ดูการแจ้งเตือน', category: 'notifications' },
    { name: 'notifications_send', description: 'ส่งการแจ้งเตือน', category: 'notifications' },
    
    // การจัดการรีวิว
    { name: 'reviews_view', description: 'ดูรีวิว', category: 'reviews' },
    { name: 'reviews_moderate', description: 'ตรวจสอบรีวิว', category: 'reviews' },
    { name: 'reviews_delete', description: 'ลบรีวิว', category: 'reviews' }
  ];

  for (const permission of defaultPermissions) {
    await sql`
      INSERT INTO permissions (name, description, category)
      VALUES (${permission.name}, ${permission.description}, ${permission.category})
      ON CONFLICT (name) DO NOTHING
    `;
  }
  console.log('✅ Added default permissions');

  // ให้สิทธิ์ทั้งหมดกับ super_admin และ admin
  const adminUsers = await sql`
    SELECT id FROM users WHERE role IN ('super_admin', 'admin')
  `;

  const allPermissions = await sql`
    SELECT id FROM permissions
  `;

  for (const admin of adminUsers) {
    for (const permission of allPermissions) {
      await sql`
        INSERT INTO user_permissions (user_id, permission_id, granted_by)
        VALUES (${admin.id}, ${permission.id}, ${admin.id})
        ON CONFLICT (user_id, permission_id) DO NOTHING
      `;
    }
  }
  console.log('✅ Granted all permissions to admin users');

  console.log('\n🎉 Permission system setup completed!');

} catch (error) {
  console.error('❌ Error:', error.message);
}

await sql.end();
process.exit(0);
