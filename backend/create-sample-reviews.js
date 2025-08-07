import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function createSampleReviews() {
  try {
    console.log('📝 Creating sample reviews...');

    // ตรวจสอบว่ามีรีวิวอยู่แล้วหรือไม่
    const existingReviews = await sql`SELECT COUNT(*) as count FROM reviews`;
    console.log(`📋 Current reviews count: ${existingReviews[0].count}`);

    if (existingReviews[0].count > 0) {
      console.log('✅ Sample reviews already exist');
      await displayReviewStats();
      await sql.end();
      return;
    }

    // ดึงข้อมูลผู้ใช้และโรงแรม
    const users = await sql`
      SELECT id, first_name, last_name, email 
      FROM users 
      WHERE role = 'user' 
      ORDER BY id 
      LIMIT 5
    `;
    
    const hotels = await sql`
      SELECT id, name 
      FROM hotels 
      ORDER BY id 
      LIMIT 3
    `;
    
    console.log(`👥 Found ${users.length} users and 🏨 ${hotels.length} hotels`);

    if (users.length === 0 || hotels.length === 0) {
      console.log('⚠️ No users or hotels found, cannot create sample reviews');
      await sql.end();
      return;
    }

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
      },
      {
        rating: 5,
        comment: 'ห้องพักหรูหรา วิวทะเลสวยงาม ชายหาดส่วนตัวเงียบสงบ อาหารทะเลสดใหม่ 🌊',
        photos: []
      },
      {
        rating: 4,
        comment: 'ตำแหน่งดีมาก เดินทางสะดวก ใกล้สถานที่ท่องเที่ยว ห้องพักสะอาด พนักงานเป็นกันเอง',
        photos: []
      },
      {
        rating: 2,
        comment: 'ห้องพักเก่าไปนิดหน่อย เครื่องปรับอากาศเสียงดัง ควรปรับปรุงหน่อย',
        photos: []
      }
    ];

    let reviewIndex = 0;

    // สร้างรีวิวสำหรับแต่ละผู้ใช้และโรงแรม
    for (const user of users) {
      for (const hotel of hotels) {
        if (reviewIndex >= sampleReviews.length) break;
        
        const review = sampleReviews[reviewIndex];
        const daysAgo = Math.floor(Math.random() * 60); // 0-60 วันที่แล้ว
        
        console.log(`📝 Creating review: User ${user.first_name} for Hotel ${hotel.name} (${review.rating}⭐)`);
        
        const isVerifiedStay = Math.random() > 0.3;
        const isApproved = Math.random() > 0.1;
        const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        await sql`
          INSERT INTO reviews (
            user_id, hotel_id, rating, comment, photos, 
            is_verified_stay, is_approved, created_at
          ) VALUES (
            ${user.id}, 
            ${hotel.id}, 
            ${review.rating}, 
            ${review.comment},
            ${JSON.stringify(review.photos)}, 
            ${isVerifiedStay},  
            ${isApproved},  
            ${createdDate}
          )
        `;
        
        reviewIndex++;
      }
      if (reviewIndex >= sampleReviews.length) break;
    }

    console.log('📊 Updating hotel ratings and review counts...');

    // อัปเดตคะแนนเฉลี่ยและจำนวนรีวิวของแต่ละโรงแรม
    for (const hotel of hotels) {
      const stats = await sql`
        SELECT 
          COALESCE(AVG(rating), 0) as avg_rating, 
          COUNT(*) as review_count
        FROM reviews 
        WHERE hotel_id = ${hotel.id} AND is_approved = true
      `;
      
      const avgRating = parseFloat(stats[0].avg_rating);
      const reviewCount = parseInt(stats[0].review_count);
      
      await sql`
        UPDATE hotels 
        SET 
          average_rating = ${avgRating.toFixed(2)}, 
          review_count = ${reviewCount}
        WHERE id = ${hotel.id}
      `;
      
      console.log(`🏨 ${hotel.name}: ${reviewCount} reviews, ${avgRating.toFixed(2)}⭐ average`);
    }

    console.log('✅ Sample reviews created successfully!');
    await displayReviewStats();
    
  } catch (error) {
    console.error('❌ Error creating sample reviews:', error);
  } finally {
    await sql.end();
  }
}

async function displayReviewStats() {
  try {
    // แสดงสถิติรวม
    const overallStats = await sql`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        COUNT(DISTINCT hotel_id) as hotels_with_reviews,
        COUNT(CASE WHEN is_verified_stay = true THEN 1 END) as verified_reviews,
        COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_reviews
      FROM reviews
    `;
    
    console.log('\n📈 Review System Statistics:');
    console.log(`📝 Total Reviews: ${overallStats[0].total_reviews}`);
    console.log(`⭐ Average Rating: ${parseFloat(overallStats[0].avg_rating || 0).toFixed(2)}/5`);
    console.log(`🏨 Hotels with Reviews: ${overallStats[0].hotels_with_reviews}`);
    console.log(`✅ Verified Reviews: ${overallStats[0].verified_reviews}`);
    console.log(`👍 Approved Reviews: ${overallStats[0].approved_reviews}`);

    // แสดงรีวิวล่าสุด
    const recentReviews = await sql`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.is_verified_stay,
        r.created_at,
        u.first_name,
        u.last_name,
        h.name as hotel_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN hotels h ON r.hotel_id = h.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `;

    console.log('\n📋 Recent Reviews:');
    for (const review of recentReviews) {
      const verified = review.is_verified_stay ? '✅' : '❔';
      console.log(`${verified} ${review.rating}⭐ ${review.first_name} ${review.last_name} @ ${review.hotel_name}`);
      console.log(`   "${review.comment.substring(0, 50)}${review.comment.length > 50 ? '...' : ''}"`);
    }
    
  } catch (error) {
    console.error('❌ Error displaying stats:', error);
  }
}

// รันฟังก์ชัน
createSampleReviews()
  .then(() => {
    console.log('\n🎉 Sample reviews setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to create sample reviews:', error);
    process.exit(1);
  });
