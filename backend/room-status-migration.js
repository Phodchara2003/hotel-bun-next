// Room Status Migration Script
import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function migrateRoomStatus() {
  console.log('🔄 Starting room status migration...');
  
  try {
    // Add new columns to rooms table
    console.log('➕ Adding new columns to rooms table...');
    await sql`
      ALTER TABLE rooms 
      ADD COLUMN IF NOT EXISTS room_number VARCHAR(10),
      ADD COLUMN IF NOT EXISTS floor INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS building VARCHAR(5) DEFAULT 'A',
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available',
      ADD COLUMN IF NOT EXISTS current_guest_id INTEGER,
      ADD COLUMN IF NOT EXISTS last_checkout TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_maintenance TIMESTAMP,
      ADD COLUMN IF NOT EXISTS next_maintenance TIMESTAMP,
      ADD COLUMN IF NOT EXISTS maintenance_notes TEXT,
      ADD COLUMN IF NOT EXISTS view_type VARCHAR(20) DEFAULT 'city',
      ADD COLUMN IF NOT EXISTS bed_type VARCHAR(20) DEFAULT 'queen',
      ADD COLUMN IF NOT EXISTS bed_count INTEGER DEFAULT 1
    `;
    console.log('✅ Room columns added successfully');

    // Add unique constraint to room_number (if not exists)
    try {
      await sql`
        ALTER TABLE rooms ADD CONSTRAINT unique_room_number UNIQUE (room_number)
      `;
      console.log('✅ Unique constraint added to room_number');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Unique constraint already exists');
      }
    }

    // Add check constraints for status
    try {
      await sql`
        ALTER TABLE rooms ADD CONSTRAINT check_room_status 
        CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning', 'blocked', 'out_of_order'))
      `;
      console.log('✅ Status check constraint added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Status constraint already exists');
      }
    }

    // Create room_status_history table
    console.log('📊 Creating room status history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS room_status_history (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        old_status VARCHAR(20),
        new_status VARCHAR(20),
        changed_by INTEGER REFERENCES users(id),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Room status history table created');

    // Create housekeeping_tasks table
    console.log('🧹 Creating housekeeping tasks table...');
    await sql`
      CREATE TABLE IF NOT EXISTS housekeeping_tasks (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        task_type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pending',
        assigned_to INTEGER REFERENCES users(id),
        description TEXT,
        estimated_duration INTEGER,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Housekeeping tasks table created');

    // Auto-assign room numbers for rooms without them
    console.log('🔢 Checking for rooms without room numbers...');
    const roomsToUpdate = await sql`
      SELECT id, room_type_id 
      FROM rooms 
      WHERE room_number IS NULL OR room_number = ''
      ORDER BY id
    `;

    if (roomsToUpdate.length > 0) {
      console.log(`📝 Auto-assigning room numbers to ${roomsToUpdate.length} rooms...`);
      for (let i = 0; i < roomsToUpdate.length; i++) {
        const room = roomsToUpdate[i];
        const roomNumber = `${String(room.id).padStart(3, '0')}`;
        await sql`
          UPDATE rooms 
          SET room_number = ${roomNumber}, 
              floor = ${Math.ceil(room.id / 10)},
              building = 'A'
          WHERE id = ${room.id}
        `;
      }
      console.log(`✅ Room numbers assigned successfully`);
    } else {
      console.log('ℹ️  All rooms already have room numbers');
    }

    // Add indexes for performance
    console.log('⚡ Adding database indexes...');
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_room_status_history_room_id ON room_status_history(room_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_room_id ON housekeeping_tasks(room_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_housekeeping_tasks_status ON housekeeping_tasks(status)`;
      console.log('✅ Database indexes created');
    } catch (error) {
      console.log('ℹ️  Some indexes already exist');
    }

    // Check migration results
    console.log('🔍 Verifying migration results...');
    const roomCount = await sql`SELECT COUNT(*) as count FROM rooms`;
    const roomsWithNumbers = await sql`
      SELECT COUNT(*) as count 
      FROM rooms 
      WHERE room_number IS NOT NULL AND room_number != ''
    `;
    
    console.log(`📊 Total rooms: ${roomCount[0].count}`);
    console.log(`📊 Rooms with numbers: ${roomsWithNumbers[0].count}`);
    
    console.log('🎉 Room status migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migration
migrateRoomStatus()
  .then(() => {
    console.log('✨ Migration process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration error:', error);
    process.exit(1);
  });
