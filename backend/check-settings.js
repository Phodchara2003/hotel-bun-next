import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkPaymentSettings() {
  try {
    const result = await sql`SELECT * FROM payment_settings LIMIT 1`;
    console.log('Current payment settings:');
    console.log(JSON.stringify(result[0], null, 2));
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await sql.end();
  }
}

checkPaymentSettings();
