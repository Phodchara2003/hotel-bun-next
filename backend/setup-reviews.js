import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function createReviewSystem() {
  try {
    console.log('🚀 Creating review system tables...');

    // สร้างตาราง reviews
    console.log('📦 Creating reviews table...');
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT DEFAULT '',
        photos JSONB DEFAULT '[]',
        is_verified_stay BOOLEAN DEFAULT false,
        is_approved BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // สร้างตาราง review_reports
    console.log('📦 Creating review_reports table...');
    await sql`
      CREATE TABLE IF NOT EXISTS review_reports (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
        admin_notes TEXT DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP WITH TIME ZONE NULL,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
      )
    `;

    // สร้าง indexes
    console.log('📊 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_hotel_id ON reviews(hotel_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved)`;

    // เพิ่มคอลัมน์ในตาราง hotels
    console.log('🏨 Updating hotels table...');
    try {
      await sql`ALTER TABLE hotels ADD COLUMN review_count INTEGER DEFAULT 0`;
    } catch (e) {
      console.log('⚠️ review_count column may already exist');
    }
    
    try {
      await sql`ALTER TABLE hotels ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.0`;
    } catch (e) {
      console.log('⚠️ average_rating column may already exist');
    }

    // ตรวจสอบว่ามีรีวิวอยู่แล้วหรือไม่
    const existingReviews = await sql`SELECT COUNT(*) as count FROM reviews`;
    console.log(`📋 Current reviews count: ${existingReviews[0].count}`);

    if (existingReviews[0].count == 0) {
      console.log('📝 Creating sample reviews...');
      
      // ดึงข้อมูลผู้ใช้และโรงแรม
      const users = await sql`SELECT id, first_name, last_name FROM users WHERE role = 'user' LIMIT 5`;
      const hotels = await sql`SELECT id, name FROM hotels LIMIT 3`;
      
      console.log(`Found ${users.length} users and ${hotels.length} hotels`);

      if (users.length > 0 && hotels.length > 0) {
        const sampleReviews = [
          { rating: 5, comment: 'โรงแรมสุดยอดมาก! พนักงานบริการดีเยี่ยม ห้องพักสะอาด อาหารอร่อย แนะนำเลยครับ 👍' },
          { rating: 4, comment: 'โดยรวมดีมาก สถานที่สวย วิวสวยมาก แต่อาจจะมีเสียงรบกวนนิดหน่อยตอนกลางคืน' },
          { rating: 5, comment: 'พักมาหลายครั้งแล้ว ประทับใจทุกครั้ง บริการสุดยอด สิ่งอำนวยความสะดวกครบครัน 🏨✨' },
          { rating: 3, comment: 'ห้องพักโอเค ราคาเหมาะสม แต่อาหารเช้าควรปรับปรุงให้หลากหลายมากกว่านี้' },
          { rating: 4, comment: 'สระว่ายน้ำสวยมาก ห้องพักกว้างขวาง พนักงานน่ารัก จะกลับมาพักอีกแน่นอน 🏊‍♀️' }
        ];

        let reviewIndex = 0;
        for (const user of users) {
          for (const hotel of hotels) {
            if (reviewIndex >= sampleReviews.length) break;
            
            const review = sampleReviews[reviewIndex];
            
            await sql`
              INSERT INTO reviews (user_id, hotel_id, rating, comment, is_verified_stay, created_at)
              VALUES (
                ${user.id}, 
                ${hotel.id}, 
                ${review.rating}, 
                ${review.comment}, 
                ${Math.random() > 0.5}, 
                NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days'
              )
            `;
            
            reviewIndex++;
          }
          if (reviewIndex >= sampleReviews.length) break;
        }

        // อัปเดตคะแนนเฉลี่ยและจำนวนรีวิว
        console.log('📊 Updating hotel ratings...');
        for (const hotel of hotels) {
          const stats = await sql`
            SELECT 
              COALESCE(AVG(rating), 0) as avg_rating, 
              COUNT(*) as review_count
            FROM reviews 
            WHERE hotel_id = ${hotel.id}
          `;
          
          await sql`
            UPDATE hotels 
            SET 
              average_rating = ${parseFloat(stats[0].avg_rating.toFixed(2))}, 
              review_count = ${parseInt(stats[0].review_count)}
            WHERE id = ${hotel.id}
          `;
        }
      }
    }

    console.log('✅ Review system created successfully!');
    
    // แสดงสถิติ
    const finalStats = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        COUNT(DISTINCT hotel_id) as hotels_with_reviews
      FROM reviews
    `;
    
    console.log('\n📈 Review System Statistics:');
    console.log(`Total Reviews: ${finalStats[0].total_reviews}`);
    console.log(`Average Rating: ${parseFloat(finalStats[0].avg_rating || 0).toFixed(2)}/5`);
    console.log(`Hotels with Reviews: ${finalStats[0].hotels_with_reviews}`);

    await sql.end();
    return true;
    
  } catch (error) {
    console.error('❌ Error creating review system:', error);
    await sql.end();
    throw error;
  }
}

// รันฟังก์ชัน
createReviewSystem()
  .then(() => {
    console.log('\n🎉 Review system setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to setup review system:', error);
    process.exit(1);
  });
