import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected successfully');
    console.log('Current time:', result[0].current_time);
    
    // Check if hotels table exists and has data
    try {
      const hotels = await sql`SELECT id, name FROM hotels LIMIT 5`;
      console.log('✅ Hotels table accessible');
      console.log('Hotels found:', hotels.length);
      if (hotels.length > 0) {
        console.log('Sample hotels:');
        hotels.forEach(hotel => {
          console.log(`  - ID: ${hotel.id}, Name: ${hotel.name}`);
        });
      }
    } catch (error) {
      console.log('❌ Error accessing hotels table:', error.message);
    }
    
    // Check if hotel ID 1 exists
    try {
      const hotel1 = await sql`SELECT id, name FROM hotels WHERE id = 1`;
      if (hotel1.length > 0) {
        console.log('✅ Hotel ID 1 found:', hotel1[0].name);
      } else {
        console.log('❌ Hotel ID 1 not found');
      }
    } catch (error) {
      console.log('❌ Error checking hotel ID 1:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await sql.end();
  }
}

testDatabase();
