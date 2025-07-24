// Migration script for room status management
// File: migrate-room-status.js

import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function migrateRoomStatus() {
  console.log('🔄 Starting room status migration...');
  
  try {
    // Add new columns to rooms table
    await sql`
      ALTER TABLE rooms 
      ADD COLUMN IF NOT EXISTS room_number VARCHAR(10),
      ADD COLUMN IF NOT EXISTS floor INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS building VARCHAR(5) DEFAULT 'A',
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available',
      ADD COLUMN IF NOT EXISTS current_guest_id INTEGER,
      ADD COLUMN IF NOT EXISTS last_checkout TIMESTAMP,
      ADD COLUMN IF NOT EXISTS next_checkin TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_maintenance TIMESTAMP,
      ADD COLUMN IF NOT EXISTS next_maintenance TIMESTAMP,
      ADD COLUMN IF NOT EXISTS maintenance_notes TEXT,
      ADD COLUMN IF NOT EXISTS view_type VARCHAR(20) DEFAULT 'city',
      ADD COLUMN IF NOT EXISTS bed_type VARCHAR(20) DEFAULT 'queen',
      ADD COLUMN IF NOT EXISTS bed_count INTEGER DEFAULT 1
    `;
    
    console.log('✅ Room columns added successfully');

    // Add unique constraint to room_number
    try {
      await sql`
        ALTER TABLE rooms ADD CONSTRAINT unique_room_number UNIQUE (room_number)
      `;
      console.log('✅ Unique constraint added to room_number');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Unique constraint already exists');
      } else {
        throw error;
      }
    }

    // Add check constraints
    try {
      await sql`
        ALTER TABLE rooms ADD CONSTRAINT check_room_status 
        CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning', 'blocked', 'out_of_order'))
      `;
      console.log('✅ Status check constraint added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Status constraint already exists');
      } else {
        console.log('⚠️  Status constraint error:', error.message);
      }
    }

    // Create room_status_history table
    await migrationClient`
      CREATE TABLE IF NOT EXISTS room_status_history (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        old_status VARCHAR(20),
        new_status VARCHAR(20),
        changed_by INTEGER REFERENCES users(id),
        reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Room status history table created');

    // Create housekeeping_tasks table
    await migrationClient`
      CREATE TABLE IF NOT EXISTS housekeeping_tasks (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        task_type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pending',
        assigned_to INTEGER REFERENCES users(id),
        estimated_duration INTEGER,
        actual_duration INTEGER,
        description TEXT,
        notes TEXT,
        checklist JSONB,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Housekeeping tasks table created');

    // Create indexes
    await migrationClient`
      CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
      CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);
      CREATE INDEX IF NOT EXISTS idx_rooms_room_number ON rooms(room_number);
      CREATE INDEX IF NOT EXISTS idx_housekeeping_room_id ON housekeeping_tasks(room_id);
      CREATE INDEX IF NOT EXISTS idx_housekeeping_status ON housekeeping_tasks(status);
    `;
    console.log('✅ Indexes created');

    // Update existing rooms with room numbers if not set
    const roomsToUpdate = await migrationClient`
      SELECT id FROM rooms WHERE room_number IS NULL
    `;

    if (roomsToUpdate.length > 0) {
      for (let i = 0; i < roomsToUpdate.length; i++) {
        const room = roomsToUpdate[i];
        const roomNumber = String(101 + i).padStart(3, '0');
        
        await migrationClient`
          UPDATE rooms 
          SET room_number = ${roomNumber}
          WHERE id = ${room.id}
        `;
      }
      console.log(`✅ Updated ${roomsToUpdate.length} rooms with room numbers`);
    }

    // Update status for existing rooms
    await migrationClient`
      UPDATE rooms 
      SET status = 'available'
      WHERE status IS NULL
    `;
    console.log('✅ Updated room status for existing rooms');

    console.log('🎉 Room status migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateRoomStatus()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateRoomStatus };
