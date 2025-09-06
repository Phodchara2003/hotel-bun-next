// Test database schema for payments API
const { sql } = require('@neondatabase/serverless');

// Initialize database connection
const dbSql = sql(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_N6QVxYpgu5EG@ep-rough-dream-a1b92i89-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function testPaymentsQuery() {
  try {
    console.log('🔍 Testing payments query...\n');
    
    // Test the exact query from admin-payments.js
    const paymentQuery = `
      SELECT 
        b.id,
        b.booking_id,
        b.total_price as amount,
        b.status,
        b.payment_receipt_url,
        b.payment_slip_url,
        b.created_at,
        b.updated_at,
        u.email as customer_email,
        u.full_name as customer_name,
        rt.name as room_type,
        h.name as hotel_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      LEFT JOIN hotels h ON rt.hotel_id = h.id
      ORDER BY b.created_at DESC
      LIMIT 10 OFFSET 0
    `;
    
    console.log('Query:', paymentQuery);
    console.log('\n🚀 Executing query...\n');
    
    const payments = await dbSql.unsafe(paymentQuery, []);
    
    console.log('✅ Query successful!');
    console.log('Results:', payments.length, 'payments found');
    
    if (payments.length > 0) {
      console.log('\nSample payment:');
      console.log(JSON.stringify(payments[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Query failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    // Test if tables exist
    console.log('\n🔍 Checking if tables exist...\n');
    
    try {
      const bookings = await dbSql`SELECT COUNT(*) FROM bookings LIMIT 1`;
      console.log('✅ bookings table exists');
    } catch (e) {
      console.log('❌ bookings table not found:', e.message);
    }
    
    try {
      const users = await dbSql`SELECT COUNT(*) FROM users LIMIT 1`;
      console.log('✅ users table exists');
    } catch (e) {
      console.log('❌ users table not found:', e.message);
    }
    
    try {
      const roomTypes = await dbSql`SELECT COUNT(*) FROM room_types LIMIT 1`;
      console.log('✅ room_types table exists');
    } catch (e) {
      console.log('❌ room_types table not found:', e.message);
    }
    
    try {
      const hotels = await dbSql`SELECT COUNT(*) FROM hotels LIMIT 1`;
      console.log('✅ hotels table exists');
    } catch (e) {
      console.log('❌ hotels table not found:', e.message);
    }
  }
}

testPaymentsQuery();
