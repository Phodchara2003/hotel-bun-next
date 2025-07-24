import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

// Check bookings table structure
const bookingColumns = await sql`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'bookings' 
  ORDER BY ordinal_position
`;

console.log('📋 Booking table columns:');
bookingColumns.forEach(col => console.log(`  - ${col.column_name}`));

// Check rooms table structure  
const roomColumns = await sql`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'rooms' 
  ORDER BY ordinal_position
`;

console.log('\n🏨 Room table columns:');
roomColumns.forEach(col => console.log(`  - ${col.column_name}`));

await sql.end();
