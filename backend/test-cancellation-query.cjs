const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

async function testCancellationAPI() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Test the exact same query from getCancellationRequests function
    const query = `
      SELECT 
        cr.id,
        cr.booking_id,
        cr.guest_name,
        cr.guest_email,
        cr.guest_phone,
        cr.room_type_name,
        cr.check_in_date,
        cr.check_out_date,
        cr.total_amount,
        cr.reason,
        cr.status,
        cr.requested_at,
        cr.processed_at,
        cr.admin_id,
        cr.admin_notes,
        b.user_id,
        u.first_name,
        u.last_name,
        u.email as user_email
      FROM cancellation_requests cr
      LEFT JOIN bookings b ON cr.booking_id = b.id
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY cr.requested_at DESC
    `;
    
    console.log('🔍 Executing query...');
    const [rows] = await connection.execute(query);
    console.log('📋 Query result:', rows.length, 'rows found');
    
    if (rows.length > 0) {
      console.log('✅ First row:', JSON.stringify(rows[0], null, 2));
    } else {
      console.log('❌ No rows returned from query');
      
      // Check if cancellation_requests table has any data
      const [simple] = await connection.execute('SELECT * FROM cancellation_requests');
      console.log('📊 Direct table query:', simple.length, 'rows');
      if (simple.length > 0) {
        console.log('🔍 Raw data:', JSON.stringify(simple[0], null, 2));
      }
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
  }
}

testCancellationAPI();