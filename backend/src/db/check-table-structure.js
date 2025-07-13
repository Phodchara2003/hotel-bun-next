import postgres from 'postgres';

// Load environment variables
const fs = await import('fs');
if (fs.existsSync('.env')) {
  const env = fs.readFileSync('.env', 'utf-8');
  env.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

const checkTableStructure = async () => {
  try {
    console.log('🔍 Checking table structure...');

    // Check room_types table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'room_types'
      ORDER BY ordinal_position
    `;

    console.log('\n📋 room_types table structure:');
    console.table(columns);

    // Check existing data
    const existingData = await sql`
      SELECT * FROM room_types LIMIT 5
    `;

    console.log('\n📊 Existing room_types data:');
    console.table(existingData);

    console.log('\n🎯 Done checking table structure');
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    await sql.end();
  }
};

checkTableStructure();
