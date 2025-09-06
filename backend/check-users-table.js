import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function checkBookingsTable() {
  try {
    console.log('� Bookings table structure:');
    
    // Get table columns
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      ORDER BY ordinal_position
    `;
    
    console.log('Columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT: ${col.column_default}` : ''}`);
    });

    // Get sample data
    console.log('\n📋 Sample bookings data:');
    const bookings = await sql`SELECT * FROM bookings LIMIT 3`;
    console.log(bookings);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkBookingsTable();
