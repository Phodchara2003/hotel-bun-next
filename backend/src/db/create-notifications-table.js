import { sql } from './database.js';

async function createNotificationsTable() {
  try {
    console.log('📦 Creating notifications table...');
    
    // Create notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_booking_id_idx ON notifications(booking_id)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type)`;
    await sql`CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at)`;

    console.log('✅ Notifications table created successfully!');
    
    // Check if table exists and show structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Notifications table structure:');
    console.table(tableInfo);
    
  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
  }
}

export { createNotificationsTable };
