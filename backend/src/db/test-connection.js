import 'dotenv/config';
import { sql } from './database.js';

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Loaded' : 'Not loaded');
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time`;
    console.log('Database connection successful:', result[0]);
    
    // Test bookings table
    console.log('Testing bookings table...');
    const bookingsCount = await sql`SELECT COUNT(*) as count FROM bookings`;
    console.log('Bookings count:', bookingsCount[0].count);
    
    // Test users table
    console.log('Testing users table...');
    const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log('Users count:', usersCount[0].count);
    
    // Test hotels table
    console.log('Testing hotels table...');
    const hotelsCount = await sql`SELECT COUNT(*) as count FROM hotels`;
    console.log('Hotels count:', hotelsCount[0].count);
    
    // Test room_types table
    console.log('Testing room_types table...');
    const roomTypesCount = await sql`SELECT COUNT(*) as count FROM room_types`;
    console.log('Room types count:', roomTypesCount[0].count);
    
    // Test complex query (similar to admin all bookings)
    console.log('Testing complex query...');
    const complexQuery = await sql`
      SELECT b.*, h.name as hotel_name, h.city, rt.name as room_type_name,
             u.email as user_email
      FROM bookings b
      LEFT JOIN hotels h ON b.hotel_id = h.id
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `;
    console.log('Complex query result count:', complexQuery.length);
    if (complexQuery.length > 0) {
      console.log('Sample booking:', {
        id: complexQuery[0].id,
        bookingReference: complexQuery[0].booking_reference,
        userEmail: complexQuery[0].user_email,
        hotelName: complexQuery[0].hotel_name,
        status: complexQuery[0].status
      });
    }
    
    console.log('All database tests passed!');
    
  } catch (error) {
    console.error('Database test failed:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log('Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
