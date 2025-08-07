import { sql } from '../db/database.js';

const createReviewTables = async () => {
  try {
    console.log('🔧 Creating review system tables...');

    // ตรวจสอบว่าตาราง reviews มีอยู่แล้วหรือไม่
    console.log('Checking if reviews table exists...');
    const reviewsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reviews'
      )
    `;
    console.log('Reviews table exists:', reviewsTableExists[0].exists);

    if (!reviewsTableExists[0].exists) {
      console.log('📦 Creating reviews table...');
      
      await sql`
        CREATE TABLE reviews (
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
    } else {
      console.log('✅ Reviews table already exists');
      
      // เช็คและเพิ่มคอลัมน์ที่อาจขาดหายไป
      const columns = await sql`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'reviews'
      `;
      
      const columnNames = columns.map(col => col.column_name);
      
      if (!columnNames.includes('photos')) {
        console.log('➕ Adding photos column to reviews...');
        await sql`ALTER TABLE reviews ADD COLUMN photos JSONB DEFAULT '[]'`;
      }
      
      if (!columnNames.includes('is_verified_stay')) {
        console.log('➕ Adding is_verified_stay column to reviews...');
        await sql`ALTER TABLE reviews ADD COLUMN is_verified_stay BOOLEAN DEFAULT false`;
      }
      
      if (!columnNames.includes('is_approved')) {
        console.log('➕ Adding is_approved column to reviews...');
        await sql`ALTER TABLE reviews ADD COLUMN is_approved BOOLEAN DEFAULT true`;
      }
      
      if (!columnNames.includes('updated_at')) {
        console.log('➕ Adding updated_at column to reviews...');
        await sql`ALTER TABLE reviews ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`;
      }
    }

    // สร้างตาราง review_reports สำหรับรายงานรีวิวที่ไม่เหมาะสม
    const reportsTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'review_reports'
      )
    `;

    if (!reportsTableExists[0].exists) {
      console.log('📦 Creating review_reports table...');
      
      await sql`
        CREATE TABLE review_reports (
          id SERIAL PRIMARY KEY,
          review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
          reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          reason VARCHAR(100) NOT NULL,
          description TEXT DEFAULT '',
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
          admin_notes TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          reviewed_at TIMESTAMP WITH TIME ZONE NULL,
          reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE(review_id, reporter_id)
        )
      `;
    } else {
      console.log('✅ Review reports table already exists');
    }

    // สร้าง indexes สำหรับประสิทธิภาพ
    console.log('📊 Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_reviews_hotel_id ON reviews(hotel_id)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved)',
      'CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status)',
      'CREATE INDEX IF NOT EXISTS idx_review_reports_created_at ON review_reports(created_at DESC)'
    ];

    for (const indexQuery of indexes) {
      await sql.unsafe(indexQuery);
    }

    // เพิ่มคอลัมน์ review_count ให้ตาราง hotels (ถ้ายังไม่มี)
    const hotelColumns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'hotels'
    `;
    
    const hotelColumnNames = hotelColumns.map(col => col.column_name);
    
    if (!hotelColumnNames.includes('review_count')) {
      console.log('➕ Adding review_count column to hotels...');
      await sql`ALTER TABLE hotels ADD COLUMN review_count INTEGER DEFAULT 0`;
      
      // อัปเดตจำนวนรีวิวที่มีอยู่
      await sql`
        UPDATE hotels SET review_count = (
          SELECT COUNT(*) FROM reviews WHERE hotel_id = hotels.id
        )
      `;
    }

    console.log('✅ Review system tables created successfully!');
    
    // สร้างข้อมูลตัวอย่าง
    await createSampleReviews();
    
    // แสดงโครงสร้างตาราง
    const reviewsInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'reviews'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Reviews table structure:');
    console.table(reviewsInfo);
    
    return true;
  } catch (error) {
    console.error('❌ Error creating review tables:', error);
    return false;
  }
};

const createSampleReviews = async () => {
  try {
    // ตรวจสอบว่ามีรีวิวอยู่แล้วหรือไม่
    const existingReviews = await sql`SELECT COUNT(*) as count FROM reviews`;
    if (existingReviews[0].count > 0) {
      console.log('📋 Sample reviews already exist');
      return;
    }

    // ดึงข้อมูลผู้ใช้และโรงแรม
    const users = await sql`SELECT id, first_name, last_name FROM users WHERE role = 'user' LIMIT 5`;
    const hotels = await sql`SELECT id, name FROM hotels LIMIT 3`;
    
    if (users.length === 0 || hotels.length === 0) {
      console.log('⚠️ No users or hotels found, skipping sample reviews');
      return;
    }

    console.log('📝 Creating sample reviews...');

    const sampleReviews = [
      {
        rating: 5,
        comment: 'โรงแรมสุดยอดมาก! พนักงานบริการดีเยี่ยม ห้องพักสะอาด อาหารอร่อย แนะนำเลยครับ 👍',
        photos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400']
      },
      {
        rating: 4,
        comment: 'โดยรวมดีมาก สถานที่สวย วิวสวยมาก แต่อาจจะมีเสียงรบกวนนิดหน่อยตอนกลางคืน',
        photos: []
      },
      {
        rating: 5,
        comment: 'พักมาหลายครั้งแล้ว ประทับใจทุกครั้ง บริการสุดยอด สิ่งอำนวยความสะดวกครบครัน 🏨✨',
        photos: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400']
      },
      {
        rating: 3,
        comment: 'ห้องพักโอเค ราคาเหมาะสม แต่อาหารเช้าควรปรับปรุงให้หลากหลายมากกว่านี้',
        photos: []
      },
      {
        rating: 4,
        comment: 'สระว่ายน้ำสวยมาก ห้องพักกว้างขวาง พนักงานน่ารัก จะกลับมาพักอีกแน่นอน 🏊‍♀️',
        photos: []
      }
    ];

    let reviewIndex = 0;
    for (const user of users) {
      for (const hotel of hotels) {
        if (reviewIndex >= sampleReviews.length) break;
        
        const review = sampleReviews[reviewIndex];
        
        await sql`
          INSERT INTO reviews (
            user_id, hotel_id, rating, comment, photos, 
            is_verified_stay, created_at
          ) VALUES (
            ${user.id}, ${hotel.id}, ${review.rating}, ${review.comment},
            ${JSON.stringify(review.photos)}, ${Math.random() > 0.5}, 
            NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days'
          )
        `;
        
        reviewIndex++;
      }
      if (reviewIndex >= sampleReviews.length) break;
    }

    // อัปเดตคะแนนเฉลี่ยของโรงแรม
    for (const hotel of hotels) {
      const stats = await sql`
        SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
        FROM reviews WHERE hotel_id = ${hotel.id}
      `;
      
      await sql`
        UPDATE hotels 
        SET rating = ${parseFloat(stats[0].avg_rating)}, 
            review_count = ${parseInt(stats[0].review_count)}
        WHERE id = ${hotel.id}
      `;
    }

    console.log('✅ Sample reviews created successfully');
  } catch (error) {
    console.error('❌ Error creating sample reviews:', error);
  }
};

// Export functions
export { createReviewTables, createSampleReviews };

// ถ้าไฟล์นี้รันโดยตรง
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Setting up review system tables...\n');
  
  createReviewTables()
    .then(() => {
      console.log('\n🎉 Review system tables setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to setup review tables:', error);
      process.exit(1);
    });
}
