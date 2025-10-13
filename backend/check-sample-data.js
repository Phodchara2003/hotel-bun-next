// Check hotels and create sample data
import { sql } from './src/db/database.js';

async function checkAndCreateSampleData() {
  console.log('🔍 Checking existing data...\n');

  try {
    // Check hotels
    console.log('1️⃣ Checking hotels...');
    const hotels = await sql`SELECT id, name FROM hotels ORDER BY id LIMIT 5`;
    console.log('✅ Hotels found:', hotels.length);
    hotels.forEach(hotel => {
      console.log(`   - ID: ${hotel.id}, Name: ${hotel.name}`);
    });

    // Check users  
    console.log('\n2️⃣ Checking users...');
    const users = await sql`SELECT id, email, first_name, last_name FROM users ORDER BY id LIMIT 5`;
    console.log('✅ Users found:', users.length);
    users.forEach(user => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}`);
    });

    // If no hotels exist, create one
    if (hotels.length === 0) {
      console.log('\n🏨 Creating sample hotel...');
      const newHotel = await sql`
        INSERT INTO hotels (name, description, address, city, country, price_per_night, rating, image_url)
        VALUES (
          'โรงแรมทดสอบ', 
          'โรงแรมสำหรับทดสอบระบบรีวิว', 
          'มหาวิทยาลัยราชภัฏมหาสารคาม', 
          'มหาสารคาม', 
          'ไทย', 
          1500, 
          4.5, 
          'https://example.com/hotel.jpg'
        )
        RETURNING id, name
      `;
      console.log('✅ Sample hotel created:', newHotel[0]);
    }

    // If no users exist, create one
    if (users.length === 0) {
      console.log('\n👤 Creating sample user...');
      const newUser = await sql`
        INSERT INTO users (email, password, first_name, last_name, role)
        VALUES (
          'test@example.com', 
          'hashed_password', 
          'Test', 
          'User', 
          'user'
        )
        RETURNING id, email, first_name, last_name
      `;
      console.log('✅ Sample user created:', newUser[0]);
    }

    // Now try to create review with existing data
    console.log('\n📝 Creating sample review...');
    const availableHotels = await sql`SELECT id FROM hotels ORDER BY id LIMIT 1`;
    const availableUsers = await sql`SELECT id FROM users ORDER BY id LIMIT 1`;

    if (availableHotels.length > 0 && availableUsers.length > 0) {
      const hotelId = availableHotels[0].id;
      const userId = availableUsers[0].id;

      const sampleReview = await sql`
        INSERT INTO reviews (
          user_id, hotel_id, booking_id, rating, comment, photos, is_verified_stay
        ) VALUES (
          ${userId}, ${hotelId}, NULL, 5, 
          'โรงแรมสุดยอดมาก! บริการดีเยี่ยม ห้องพักสะอาด วิวสวย แนะนำเลยครับ 🏨✨', 
          '[]', false
        ) RETURNING id, created_at
      `;
      
      console.log('✅ Sample review created:', sampleReview[0]);

      // Test retrieving reviews
      console.log('\n📖 Testing review retrieval...');
      const reviews = await sql`
        SELECT 
          r.id, r.rating, r.comment, r.is_verified_stay,
          r.created_at, r.user_id, r.hotel_id
        FROM reviews r
        WHERE r.hotel_id = ${hotelId} AND r.is_approved = true
        ORDER BY r.created_at DESC
        LIMIT 10
      `;
      
      console.log('✅ Reviews retrieved:', reviews.length);
      reviews.forEach((review, index) => {
        console.log(`   ${index + 1}. ID: ${review.id}, Rating: ${review.rating}/5`);
        console.log(`      Comment: ${review.comment.substring(0, 60)}...`);
        console.log(`      User ID: ${review.user_id}, Hotel ID: ${review.hotel_id}`);
      });

    } else {
      console.log('❌ No hotels or users available');
    }

    console.log('\n🎉 Sample data creation completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndCreateSampleData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });