import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function testReviewsApi() {
  try {
    console.log('🔍 Testing Reviews API data...');

    // ตรวจสอบโรงแรม
    const hotels = await sql`SELECT id, name FROM hotels`;
    console.log('🏨 Hotels:', hotels);

    // ตรวจสอบรีวิว
    const reviews = await sql`
      SELECT r.*, u.first_name, u.last_name, h.name as hotel_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN hotels h ON r.hotel_id = h.id
      LIMIT 5
    `;
    console.log('📝 Reviews:', reviews);

    // ทดสอบ query สำหรับโรงแรม ID 1
    const hotelReviews = await sql`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.photos,
        r.is_verified_stay,
        r.created_at,
        u.first_name,
        u.last_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.hotel_id = 1 AND r.is_approved = true
      ORDER BY r.created_at DESC
    `;
    console.log('🏨 Hotel ID 1 Reviews:', hotelReviews);

    // ตรวจสอบโครงสร้างตาราง reviews
    const reviewColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reviews'
    `;
    console.log('📋 Reviews table columns:', reviewColumns);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

testReviewsApi();
