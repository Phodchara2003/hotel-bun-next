import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

console.log('Checking current user table structure...');

try {
  // ตรวจสอบโครงสร้างตาราง users
  const userColumns = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `;
  
  console.log('📋 Current users table structure:');
  userColumns.forEach(col => {
    console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
  });

  // ตรวจสอบข้อมูลผู้ใช้ปัจจุบัน
  const users = await sql`
    SELECT id, email, first_name, last_name, role, created_at
    FROM users
    LIMIT 5
  `;
  
  console.log('\n👥 Sample users:');
  users.forEach(user => {
    console.log(`  ${user.id}: ${user.email} (${user.role})`);
  });

} catch (error) {
  console.error('❌ Error:', error.message);
}

await sql.end();
process.exit(0);
