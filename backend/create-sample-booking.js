// Create sample booking data for testing
import { sql } from './src/db/database.js';

async function createSampleBooking() {
  try {
    console.log('📝 Creating sample booking data...');
    
    // Check if user exists
    let users = await sql`SELECT id FROM users LIMIT 1`;
    let userId;
    
    if (users.length === 0) {
      console.log('👤 Creating sample user...');
      const userResult = await sql`
        INSERT INTO users (email, password, first_name, last_name, role, created_at)
        VALUES ('test@example.com', 'password123', 'Test', 'User', 'user', NOW())
        RETURNING id
      `;
      userId = userResult[0].id;
    } else {
      userId = users[0].id;
    }
    
    // Check if hotel exists
    let hotels = await sql`SELECT id FROM hotels LIMIT 1`;
    let hotelId;
    
    if (hotels.length === 0) {
      console.log('🏨 Creating sample hotel...');
      const hotelResult = await sql`
        INSERT INTO hotels (name, city, address, description, created_at)
        VALUES ('โรงแรมวรุณภัฏ มหาวิทยาลัยราชภัฏมหาสารคาม', 'มหาสารคาม', '123 ถนนนครสวรรค์', 'โรงแรมสำหรับนักศึกษาและบุคลากร', NOW())
        RETURNING id
      `;
      hotelId = hotelResult[0].id;
    } else {
      hotelId = hotels[0].id;
    }
    
    // Check if room type exists
    let roomTypes = await sql`SELECT id, price_per_night FROM room_types LIMIT 1`;
    let roomTypeId, roomPrice;
    
    if (roomTypes.length === 0) {
      console.log('🛏️ Creating sample room type...');
      const roomTypeResult = await sql`
        INSERT INTO room_types (name, description, price_per_night, max_guests, hotel_id, bed_type, created_at)
        VALUES ('ห้องเตียงคู่ (Double Room)', 'ห้องพักสำหรับ 2 คน', 300.00, 2, ${hotelId}, 'เตียงคู่', NOW())
        RETURNING id, price_per_night
      `;
      roomTypeId = roomTypeResult[0].id;
      roomPrice = roomTypeResult[0].price_per_night;
    } else {
      roomTypeId = roomTypes[0].id;
      roomPrice = roomTypes[0].price_per_night;
    }
    
    // Create sample booking
    console.log('📅 Creating sample booking...');
    const booking = await sql`
      INSERT INTO bookings (
        user_id, hotel_id, room_type_id,
        check_in_date, check_out_date, nights,
        guests, total_price, room_price,
        status, booking_reference, created_at
      )
      VALUES (
        ${userId}, ${hotelId}, ${roomTypeId},
        '2025-10-15', '2025-10-17', 2,
        1, ${roomPrice * 2}, ${roomPrice},
        'pending', 'HTL800420', NOW()
      )
      RETURNING *
    `;
    
    console.log('✅ Sample booking created:');
    console.log('ID:', booking[0].id);
    console.log('Reference:', booking[0].booking_reference);
    console.log('Room price per night:', booking[0].room_price);
    console.log('Total price:', booking[0].total_price);
    console.log('Nights:', booking[0].nights);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample booking:', error);
    process.exit(1);
  }
}

createSampleBooking();