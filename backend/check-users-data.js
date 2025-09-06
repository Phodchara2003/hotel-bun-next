import { sql } from './src/db/database.js';

console.log('🔍 Checking users data in database...');

try {
  const result = await sql`
    SELECT id, email, first_name, last_name, role, created_at
    FROM users 
    ORDER BY created_at DESC
  `;
  
  console.log('\n📊 Users in database:');
  console.log('Total users:', result.length);
  console.log('\nUser details:');
  result.forEach(user => {
    console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}, Role: ${user.role}`);
  });
  
  // Count by roles
  const roles = {};
  result.forEach(user => {
    roles[user.role] = (roles[user.role] || 0) + 1;
  });
  
  console.log('\n📈 Users by roles:');
  Object.entries(roles).forEach(([role, count]) => {
    console.log(`- ${role}: ${count} users`);
  });

} catch (error) {
  console.error('❌ Error:', error);
} finally {
  process.exit(0);
}
