import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

console.log('Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');

try {
  const result = await sql`SELECT 1 as test, NOW() as timestamp`;
  console.log('✅ Database connection successful!');
  console.log('Result:', result);
} catch (error) {
  console.error('❌ Database connection failed:');
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
}

await sql.end();
process.exit(0);
