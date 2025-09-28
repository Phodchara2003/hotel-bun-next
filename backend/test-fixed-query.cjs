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

async function testFixedQuery() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Test the corrected query
    const query = `
      SELECT 
        cr.id,
        cr.booking_id,
        cr.user_id,
        cr.reason,
        cr.status,
        cr.admin_id,
        cr.admin_notes,
        cr.requested_at,
        cr.processed_at,
        cr.created_at,
        cr.updated_at,
        b.guest_name,
        b.guest_email,
        b.guest_phone,
        b.check_in_date,
        b.check_out_date,
        b.total_amount,
        rt.name as room_type_name,
        u.first_name,
        u.last_name,
        u.email as user_email
      FROM cancellation_requests cr
      LEFT JOIN bookings b ON cr.booking_id = b.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      LEFT JOIN users u ON cr.user_id = u.id
      ORDER BY cr.requested_at DESC
    `;
    
    console.log('🔍 Testing corrected query...');
    const [rows] = await connection.execute(query);
    console.log('📋 Query result:', rows.length, 'rows found');
    
    if (rows.length > 0) {
      console.log('✅ First row:', JSON.stringify(rows[0], null, 2));
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
  }
}

testFixedQuery();