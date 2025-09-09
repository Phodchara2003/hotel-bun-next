import { sql } from './src/db/database.js';
import 'dotenv/config';

async function checkRoomTypesStructure() {
  try {
    console.log('🔍 Checking room_types table structure...');
    
    // Get table columns
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'room_types' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 room_types table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Get sample data
    const sampleData = await sql`SELECT * FROM room_types LIMIT 3`;
    console.log('\n📄 Sample room_types data:');
    console.log(sampleData);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkRoomTypesStructure();
