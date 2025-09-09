import { sql } from './src/db/database.js';

console.log('Checking if notifications table exists...');

try {
  // Check if notifications table exists
  const tableExists = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications'
    );
  `;
  
  console.log('Notifications table exists:', tableExists[0].exists);
  
  if (tableExists[0].exists) {
    // If table exists, get a sample of data
    const sampleData = await sql`
      SELECT * FROM notifications LIMIT 3;
    `;
    console.log('Sample notifications data:', sampleData);
    
    // Get table structure
    const tableStructure = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `;
    console.log('Notifications table structure:', tableStructure);
  } else {
    console.log('Notifications table does not exist in the database');
  }
  
} catch (error) {
  console.error('Error checking notifications table:', error);
} finally {
  process.exit(0);
}
