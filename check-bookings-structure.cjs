// Check bookings table structure
const { sql } = require('postgres');

// Initialize database connection
const dbSql = sql(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_N6QVxYpgu5EG@ep-rough-dream-a1b92i89-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function checkBookingsTable() {
  try {
    console.log('🔍 Checking bookings table structure...\n');
    
    // Get table structure
    const columns = await dbSql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Bookings table columns:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n📊 Sample bookings data:');
    const sample = await dbSql`SELECT * FROM bookings LIMIT 3`;
    console.log('Sample records:', sample.length);
    if (sample.length > 0) {
      console.log('Sample booking fields:', Object.keys(sample[0]));
      console.log('First booking:', sample[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBookingsTable();
