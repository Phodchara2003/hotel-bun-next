import { sql } from './src/db/database.js';

async function checkReviewsSchema() {
  try {
    // Check reviews table schema
    const schema = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'reviews' 
      ORDER BY ordinal_position
    `;
    
    console.log('Reviews table schema:');
    console.table(schema);
    
    // Check actual reviews data
    const reviews = await sql`SELECT * FROM reviews LIMIT 5`;
    console.log('\nSample reviews data:');
    console.log(JSON.stringify(reviews, null, 2));
    
    // Check if users table exists
    const usersTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'users'
    `;
    console.log('\nUsers table exists:', usersTables.length > 0);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkReviewsSchema();
