import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

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

const addTypeColumn = async () => {
  try {
    console.log('🚀 Adding type column to room_types table...');

    // Add type column
    await sql`
      ALTER TABLE room_types
      ADD COLUMN IF NOT EXISTS type VARCHAR(100)
    `;
    console.log('✅ Added type column');

    // Update existing records
    await sql`
      UPDATE room_types 
      SET type = CASE 
        WHEN name LIKE '%Deluxe%' THEN 'Deluxe Room'
        WHEN name LIKE '%Family%' THEN 'Family Room' 
        WHEN name LIKE '%Suite%' THEN 'Executive Suite'
        WHEN name LIKE '%Standard%' THEN 'Standard Room'
        WHEN name LIKE '%Presidential%' THEN 'Presidential Suite'
        ELSE 'Standard Room'
      END
      WHERE type IS NULL
    `;
    console.log('✅ Updated existing records with type values');

    // Display current structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'room_types' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Current room_types table structure:');
    columns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Display sample data
    const sampleData = await sql`
      SELECT id, name, type, price_per_night, max_guests
      FROM room_types 
      LIMIT 5
    `;
    
    console.log('📋 Sample room data:');
    sampleData.forEach(room => {
      console.log(`  ID: ${room.id}, Name: ${room.name}, Type: ${room.type}, Price: ${room.price_per_night}`);
    });

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
};

addTypeColumn();
