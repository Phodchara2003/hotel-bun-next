import { sql } from './database.js';

async function addPaymentSlipColumns() {
  try {
    console.log('Adding payment slip columns to bookings table...');
    
    // Add payment slip columns to bookings table
    await sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS payment_slip_url TEXT,
      ADD COLUMN IF NOT EXISTS payment_slip_filename VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending'
    `;
    
    console.log('✅ Payment slip columns added successfully');
  } catch (error) {
    console.error('❌ Error adding payment slip columns:', error);
  }
}

// Run the migration
addPaymentSlipColumns();
