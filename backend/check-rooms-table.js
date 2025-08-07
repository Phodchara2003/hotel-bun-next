import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

(async () => {
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rooms'
      ORDER BY ordinal_position
    `;
    console.log('Rooms table columns:');
    columns.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));
    
    // Check if images column exists
    const hasImages = columns.some(col => col.column_name === 'images');
    console.log('\nImages column exists:', hasImages);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
