import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkRoomsData() {
  try {
    console.log('🔍 Checking database for rooms data...\n');
    
    // Check if room_types table exists
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%room%'
    `;
    
    console.log('📋 Room-related tables:');
    tables.forEach(table => console.log(`  - ${table.table_name}`));
    console.log('');
    
    // Check room_types data
    try {
      const roomTypes = await sql`SELECT * FROM room_types LIMIT 5`;
      console.log('🏨 Room types data:');
      console.log(JSON.stringify(roomTypes, null, 2));
    } catch (error) {
      console.log('❌ Error accessing room_types:', error.message);
    }
    
    // Check hotels data
    try {
      const hotels = await sql`SELECT * FROM hotels LIMIT 3`;
      console.log('\n🏨 Hotels data:');
      console.log(JSON.stringify(hotels, null, 2));
    } catch (error) {
      console.log('❌ Error accessing hotels:', error.message);
    }
    
    await sql.end();
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkRoomsData();
