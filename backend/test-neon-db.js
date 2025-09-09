import { sql } from './src/db/database.js';
import 'dotenv/config';

async function testNeonConnection() {
  try {
    console.log('🔗 Testing Neon PostgreSQL connection...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Connected' : 'Not found');
    
    // Test basic connection
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Test tables existence
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📋 Available tables:');
    tables.forEach(table => console.log(`  - ${table.table_name}`));
    
    // Test hotels table
    const hotelCount = await sql`SELECT COUNT(*) as count FROM hotels`;
    console.log(`🏨 Hotels in database: ${hotelCount[0].count}`);
    
    if (parseInt(hotelCount[0].count) > 0) {
      const hotels = await sql`SELECT id, name FROM hotels LIMIT 3`;
      console.log('🏨 Sample hotels:');
      hotels.forEach(hotel => console.log(`  - ${hotel.id}: ${hotel.name}`));
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    process.exit(0);
  }
}

testNeonConnection();
