const mysql = require('mysql2/promise');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hotel_booking'
});

async function checkReceiptData() {
  try {
    await connection.connect();
    console.log('🔗 Connected to database');
    
    const [rows] = await connection.execute(`
      SELECT 
        id,
        guest_name,
        payment_receipt_url,
        payment_status,
        receipt_filename,
        receipt_file_size,
        receipt_uploaded_at
      FROM bookings 
      WHERE payment_receipt_url IS NOT NULL 
      ORDER BY receipt_uploaded_at DESC 
      LIMIT 5
    `);
    
    console.log(`\n📊 Found ${rows.length} bookings with payment receipts:`);
    
    rows.forEach((row, index) => {
      console.log(`\n--- Booking ${index + 1} ---`);
      console.log(`ID: ${row.id}`);
      console.log(`Guest: ${row.guest_name}`);
      console.log(`Status: ${row.payment_status}`);
      console.log(`Filename: ${row.receipt_filename}`);
      console.log(`File Size: ${row.receipt_file_size} bytes`);
      console.log(`Uploaded: ${row.receipt_uploaded_at}`);
      
      const receiptUrl = row.payment_receipt_url;
      if (receiptUrl) {
        console.log(`Receipt URL Type: ${receiptUrl.startsWith('data:') ? 'Base64 Data URL' : 'File Path'}`);
        console.log(`Receipt URL Length: ${receiptUrl.length} characters`);
        console.log(`Receipt URL Preview: ${receiptUrl.substring(0, 100)}...`);
        
        if (receiptUrl.startsWith('data:')) {
          const [header, data] = receiptUrl.split(',');
          console.log(`Header: ${header}`);
          console.log(`Data Length: ${data ? data.length : 'NO DATA'} characters`);
          
          // Test if base64 is valid
          if (data) {
            try {
              const testDecode = Buffer.from(data, 'base64');
              console.log(`✅ Base64 is valid, decoded size: ${testDecode.length} bytes`);
              
              // Check if it's a valid image by looking at the first few bytes
              const firstBytes = testDecode.slice(0, 10);
              console.log(`First bytes: ${Array.from(firstBytes).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
              
              // JPEG starts with FF D8 FF
              if (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8 && firstBytes[2] === 0xFF) {
                console.log('✅ Valid JPEG signature detected');
              } else {
                console.log('⚠️ Not a valid JPEG signature');
              }
            } catch (error) {
              console.log(`❌ Base64 decode error: ${error.message}`);
            }
          } else {
            console.log('❌ No base64 data found after comma');
          }
        }
      } else {
        console.log('❌ No receipt URL found');
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
    console.log('\n🔐 Database connection closed');
  }
}

checkReceiptData();