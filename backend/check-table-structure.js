import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkTable() {
  try {
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payment_settings'
      ORDER BY ordinal_position
    `;
    console.log('Payment Settings Table Structure:');
    result.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkTable();
