// Add missing columns to bookings table
import { sql } from './src/db/database.js';

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to bookings table...');
    
    // Add nights column
    try {
      await sql`
        ALTER TABLE bookings 
        ADD COLUMN nights INTEGER DEFAULT 1
      `;
      console.log('✅ Added nights column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ nights column already exists');
      } else {
        throw error;
      }
    }
    
    // Add room_price column
    try {
      await sql`
        ALTER TABLE bookings 
        ADD COLUMN room_price DECIMAL(10,2) DEFAULT 0.00
      `;
      console.log('✅ Added room_price column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ room_price column already exists');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Database schema updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating schema:', error);
    process.exit(1);
  }
}

addMissingColumns();