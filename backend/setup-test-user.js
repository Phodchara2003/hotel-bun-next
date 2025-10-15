// Link booking to test user
import { sql } from './src/db/database.js';

async function linkBookingToUser() {
  try {
    console.log('👤 Setting up test user for booking...');
    
    // Get or create test user
    let users = await sql`
      SELECT id FROM users WHERE email = 'test@example.com'
    `;
    
    let userId;
    if (users.length === 0) {
      const userResult = await sql`
        INSERT INTO users (email, password, first_name, last_name, role, created_at)
        VALUES ('test@example.com', '$2b$10$XYZ123ABC', 'Test', 'User', 'user', NOW())
        RETURNING id
      `;
      userId = userResult[0].id;
      console.log('✅ Created test user with ID:', userId);
    } else {
      userId = users[0].id;
      console.log('✅ Found existing test user with ID:', userId);
    }
    
    // Link booking to this user
    await sql`
      UPDATE bookings 
      SET user_id = ${userId}
      WHERE booking_reference = 'HTL800420'
    `;
    
    console.log('✅ Linked booking HTL800420 to user');
    
    // Show login credentials
    console.log('\n🔑 Test Login Credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('\n📋 Test this at: http://localhost:3002/login');
    console.log('Then go to: http://localhost:3002/bookings');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

linkBookingToUser();