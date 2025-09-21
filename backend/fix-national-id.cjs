const mysql = require('mysql2/promise');

async function fixNationalIdData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'hotel_booking'
  });

  try {
    console.log('🔍 Checking current national_id data...');
    
    // Check users table
    const [userRows] = await connection.execute('SELECT id, email, national_id FROM users WHERE national_id IS NOT NULL AND national_id != ""');
    
    console.log('\n📊 Users table data:');
    userRows.forEach(row => {
      const cleanId = row.national_id ? row.national_id.replace(/\D/g, '') : '';
      const idLength = cleanId.length;
      console.log(`User ID: ${row.id}, Email: ${row.email}, National ID: ${row.national_id}, Clean: ${cleanId}, Length: ${idLength} digits`);
    });

    // Check bookings table for guest_id_number
    const [bookingRows] = await connection.execute('SELECT id, guest_name, guest_id_number FROM bookings WHERE guest_id_number IS NOT NULL AND guest_id_number != ""');
    
    console.log('\n📊 Bookings table data:');
    bookingRows.forEach(row => {
      const cleanId = row.guest_id_number ? row.guest_id_number.replace(/\D/g, '') : '';
      const idLength = cleanId.length;
      console.log(`Booking ID: ${row.id}, Guest: ${row.guest_name}, Guest ID: ${row.guest_id_number}, Clean: ${cleanId}, Length: ${idLength} digits`);
    });

    // Fix users table - truncate to 13 digits
    console.log('\n🔧 Fixing users table...');
    for (const row of userRows) {
      const cleanId = row.national_id.replace(/\D/g, '');
      if (cleanId.length > 13) {
        const fixedId = cleanId.substring(0, 13);
        console.log(`Fixing User ${row.id}: ${cleanId} -> ${fixedId}`);
        await connection.execute('UPDATE users SET national_id = ? WHERE id = ?', [fixedId, row.id]);
      } else if (cleanId.length < 13 && cleanId.length > 0) {
        console.log(`⚠️  User ${row.id} has ${cleanId.length} digits: ${cleanId} - may need manual review`);
      }
    }

    // Fix bookings table - truncate to 13 digits
    console.log('\n🔧 Fixing bookings table...');
    for (const row of bookingRows) {
      const cleanId = row.guest_id_number.replace(/\D/g, '');
      if (cleanId.length > 13) {
        const fixedId = cleanId.substring(0, 13);
        console.log(`Fixing Booking ${row.id}: ${cleanId} -> ${fixedId}`);
        await connection.execute('UPDATE bookings SET guest_id_number = ? WHERE id = ?', [fixedId, row.id]);
      } else if (cleanId.length < 13 && cleanId.length > 0) {
        console.log(`⚠️  Booking ${row.id} has ${cleanId.length} digits: ${cleanId} - may need manual review`);
      }
    }

    console.log('\n✅ Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

fixNationalIdData();