const mysql = require('mysql2/promise');

async function addCheckInOutFields() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });
    
    console.log('🔧 Adding check-in/check-out fields to bookings table...');
    
    const alterQuery = `
      ALTER TABLE bookings 
      ADD COLUMN actual_check_in_time TIMESTAMP NULL COMMENT 'เวลาที่เช็คอินจริง',
      ADD COLUMN actual_check_out_time TIMESTAMP NULL COMMENT 'เวลาที่เช็คเอ้าจริง',
      ADD COLUMN check_in_staff_id INT(11) NULL COMMENT 'ID ของพนักงานที่ทำการเช็คอิน',
      ADD COLUMN check_out_staff_id INT(11) NULL COMMENT 'ID ของพนักงานที่ทำการเช็คเอ้า',
      ADD COLUMN check_in_notes TEXT NULL COMMENT 'หมายเหตุการเช็คอิน',
      ADD COLUMN check_out_notes TEXT NULL COMMENT 'หมายเหตุการเช็คเอ้า'
    `;
    
    await connection.execute(alterQuery);
    console.log('✅ Successfully added check-in/check-out fields!');
    
    // ตรวจสอบโครงสร้างใหม่
    const [columns] = await connection.execute('DESCRIBE bookings');
    console.log('\n📋 Updated bookings table schema:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });
    
    await connection.end();
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ Fields already exist in the table');
    } else {
      console.error('Error:', error.message);
    }
  }
}

addCheckInOutFields();