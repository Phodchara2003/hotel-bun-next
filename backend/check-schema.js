// Check database schema
import { sql } from './src/db/database.js';

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check bookings table structure
    const bookingsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📊 Bookings table columns:');
    bookingsColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if there's any existing data
    const existingBookings = await sql`SELECT * FROM bookings LIMIT 1`;
    console.log('\n📅 Existing bookings count:', existingBookings.length);
    
    if (existingBookings.length > 0) {
      console.log('Sample booking data:');
      console.log(existingBookings[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSchema();