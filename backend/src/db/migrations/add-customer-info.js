import { sql } from './database.js';

async function addCustomerInfoColumns() {
  console.log('🚀 Adding customer info columns to bookings table...');
  
  try {
    // เพิ่มคอลัมน์ใหม่ในตาราง bookings
    await sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS guest_address TEXT,
      ADD COLUMN IF NOT EXISTS guest_id_number VARCHAR(50)
    `;
    
    console.log('✅ Customer info columns added successfully!');
    console.log('📋 Added columns:');
    console.log('   - guest_name (ชื่อลูกค้า)');
    console.log('   - guest_phone (เบอร์โทรศัพท์)');
    console.log('   - guest_email (อีเมล)');
    console.log('   - guest_address (ที่อยู่)');
    console.log('   - guest_id_number (เลขประจำตัว)');
    
  } catch (error) {
    console.error('❌ Error adding customer info columns:', error);
    throw error;
  }
}

// รันฟังก์ชันถ้าไฟล์นี้ถูกเรียกโดยตรง
if (import.meta.main) {
  addCustomerInfoColumns()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { addCustomerInfoColumns };
