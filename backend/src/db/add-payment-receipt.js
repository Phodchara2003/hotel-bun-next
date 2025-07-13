const { neon } = require('@neondatabase/serverless');

const sql = neon('postgresql://neondb_owner:npg_N6QVxYpgu5EG@ep-rough-dream-a1b92i89-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function addPaymentReceiptColumn() {
  try {
    console.log('Adding payment_receipt_url column to bookings table...');
    
    // Add payment_receipt_url column
    await sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;
    `;
    
    console.log('Successfully added payment_receipt_url column');
    
    // Check the current table structure
    const result = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Current bookings table structure:');
    console.table(result);
    
  } catch (error) {
    console.error('Error adding payment_receipt_url column:', error);
    throw error;
  }
}

// Run the migration
addPaymentReceiptColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
