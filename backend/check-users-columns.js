import { sql } from './src/db/database.js';

async function checkUsersColumns() {
  try {
    console.log('🔍 Checking users table columns...');
    
    // Get column information
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Users table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if address and username columns exist
    const hasAddress = columns.some(col => col.column_name === 'address');
    const hasUsername = columns.some(col => col.column_name === 'username');
    
    console.log(`\n🏠 Has address column: ${hasAddress}`);
    console.log(`👤 Has username column: ${hasUsername}`);
    
    if (!hasAddress || !hasUsername) {
      console.log('\n⚠️  Missing columns detected. Adding them...');
      
      if (!hasAddress) {
        await sql`ALTER TABLE users ADD COLUMN address TEXT`;
        console.log('✅ Added address column');
      }
      
      if (!hasUsername) {
        await sql`ALTER TABLE users ADD COLUMN username VARCHAR(255)`;
        console.log('✅ Added username column');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

checkUsersColumns();
