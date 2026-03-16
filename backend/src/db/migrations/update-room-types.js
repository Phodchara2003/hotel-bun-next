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

const updateRoomTypes = async () => {
  try {
    console.log('🚀 Starting room_types table update...');

    // Add new columns
    await sql`
      ALTER TABLE room_types
      ADD COLUMN IF NOT EXISTS amenities TEXT[],
      ADD COLUMN IF NOT EXISTS image TEXT,
      ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS beds INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `;
    console.log('✅ Added new columns to room_types table');

    // Update existing room_types with default values
    await sql`
      UPDATE room_types 
      SET 
        amenities = ARRAY['wifi', 'aircon', 'tv']::TEXT[],
        image = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
        available = true,
        beds = 1,
        created_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE amenities IS NULL OR image IS NULL
    `;
    console.log('✅ Updated existing rooms with default values');

    // Get hotel ID
    const hotelResult = await sql`SELECT id FROM hotels LIMIT 1`;
    if (hotelResult.length === 0) {
      console.log('❌ No hotel found');
      return;
    }
    const hotelId = hotelResult[0].id;

    // Add sample room data
    const sampleRooms = [
      {
        name: 'Deluxe Room 201',
        type: 'Deluxe Room',
        capacity: 4,
        price: 3500.00,
        description: 'ห้องพักระดับดีลักซ์ พร้อมวิวสวนสวย และสิ่งอำนวยความสะดวกครบครัน',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'breakfast'],
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        beds: 2
      },
      {
        name: 'Family Suite 301',
        type: 'Family Room',
        capacity: 6,
        price: 4500.00,
        description: 'ห้องสำหรับครอบครัว ขนาดใหญ่ สะดวกสบาย เหมาะสำหรับกลุ่มใหญ่',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'breakfast', 'parking'],
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        beds: 3
      },
      {
        name: 'Presidential Suite 401',
        type: 'Presidential Suite',
        capacity: 8,
        price: 8000.00,
        description: 'ห้องพักระดับประธานาธิบดี หรูหรา พร้อมสิ่งอำนวยความสะดวกระดับพรีเมียม',
        amenities: ['wifi', 'aircon', 'tv', 'minibar', 'breakfast', 'parking'],
        image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        beds: 4
      }
    ];

    for (const room of sampleRooms) {
      // Check if room already exists
      const existingRoom = await sql`
        SELECT id FROM room_types WHERE name = ${room.name}
      `;

      if (existingRoom.length === 0) {
        await sql`
          INSERT INTO room_types (
            hotel_id, name, type, capacity, price, description, 
            amenities, image, available, beds, created_at, updated_at
          ) VALUES (${hotelId}, ${room.name}, ${room.type}, ${room.capacity}, ${room.price}, 
            ${room.description}, ${room.amenities}, ${room.image}, ${true}, ${room.beds},
            ${new Date()}, ${new Date()})
        `;
        console.log(`✅ Added room: ${room.name}`);
      } else {
        console.log(`ℹ️  Room already exists: ${room.name}`);
      }
    }

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_room_types_available ON room_types (available)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_room_types_type ON room_types (type)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_room_types_price ON room_types (price)
    `;
    console.log('✅ Created indexes');

    // Create update trigger
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_room_types_updated_at ON room_types
    `;

    await sql`
      CREATE TRIGGER update_room_types_updated_at
          BEFORE UPDATE ON room_types
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column()
    `;
    console.log('✅ Created update trigger');

    // Display results
    const results = await sql`
      SELECT 
          rt.id,
          rt.name,
          rt.type,
          rt.capacity,
          rt.price,
          rt.available,
          rt.amenities,
          h.name as hotel_name
      FROM room_types rt
      JOIN hotels h ON rt.hotel_id = h.id
      ORDER BY rt.type, rt.name
    `;

    console.log('\n📊 Current room_types:');
    console.table(results);

    console.log('🎉 Room types table updated successfully!');
  } catch (error) {
    console.error('❌ Error updating room_types table:', error);
  } finally {
    await sql.end();
  }
};

updateRoomTypes();
