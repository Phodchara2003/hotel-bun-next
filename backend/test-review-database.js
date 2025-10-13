// Test script ที่ข้าม auth middleware
import { sql } from './src/db/database.js';

async function testReviewDatabase() {
  console.log('🧪 Testing Review Database Operations...\n');

  try {
    // Test 1: ตรวจสอบว่าตาราง reviews มีอยู่หรือไม่
    console.log('1️⃣ Checking if reviews table exists...');
    
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reviews'
      )
    `;
    
    console.log('✅ Reviews table exists:', tableExists[0].exists);

    if (!tableExists[0].exists) {
      console.log('❌ Reviews table does not exist. Creating...');
      
      // สร้างตาราง reviews
      await sql`
        CREATE TABLE reviews (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          hotel_id INTEGER NOT NULL,
          booking_id INTEGER,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT DEFAULT '',
          photos JSONB DEFAULT '[]',
          is_verified_stay BOOLEAN DEFAULT false,
          is_approved BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      console.log('✅ Reviews table created successfully');
    }

    // Test 2: เพิ่มรีวิวตัวอย่าง
    console.log('\n2️⃣ Inserting sample review...');
    
    const sampleReview = await sql`
      INSERT INTO reviews (
        user_id, hotel_id, booking_id, rating, comment, photos, is_verified_stay
      ) VALUES (
        1, 1, NULL, 5, 'โรงแรมสุดยอดมาก! บริการดีเยี่ยม ห้องพักสะอาด วิวสวย แนะนำเลยครับ 🏨✨', 
        '[]', false
      ) RETURNING id, created_at
    `;
    
    console.log('✅ Sample review inserted:', sampleReview[0]);

    // Test 3: ดึงรีวิวที่เพิ่งสร้าง
    console.log('\n3️⃣ Fetching reviews for hotel ID 1...');
    
    const reviews = await sql`
      SELECT 
        r.id, r.rating, r.comment, r.photos, r.is_verified_stay,
        r.created_at, r.updated_at,
        r.user_id, r.hotel_id, r.booking_id
      FROM reviews r
      WHERE r.hotel_id = 1 AND r.is_approved = true
      ORDER BY r.created_at DESC
      LIMIT 10
    `;
    
    console.log('✅ Reviews found:', reviews.length);
    reviews.forEach((review, index) => {
      console.log(`   ${index + 1}. ID: ${review.id}, Rating: ${review.rating}/5`);
      console.log(`      Comment: ${review.comment.substring(0, 50)}...`);
      console.log(`      Created: ${review.created_at}`);
    });

    // Test 4: ดึงสถิติรีวิว
    console.log('\n4️⃣ Getting review statistics...');
    
    const stats = await sql`
      SELECT 
        AVG(rating) as average_rating,
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews 
      WHERE hotel_id = 1 AND is_approved = true
    `;
    
    console.log('✅ Review statistics:', {
      averageRating: parseFloat(stats[0].average_rating || 0).toFixed(2),
      totalReviews: stats[0].total_reviews,
      breakdown: {
        5: stats[0].five_star,
        4: stats[0].four_star, 
        3: stats[0].three_star,
        2: stats[0].two_star,
        1: stats[0].one_star
      }
    });

    console.log('\n🎉 Review database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing review database:', error);
  }
}

testReviewDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });