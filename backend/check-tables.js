import { sql } from './src/db/database.js';

try {
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `;
  console.log('Tables in database:', tables.map(t => t.table_name));
} catch (error) {
  console.error('Error:', error);
}
process.exit(0);
