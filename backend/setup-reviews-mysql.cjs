const mysql = require('mysql2/promise');
require('dotenv').config();

async function createReviewsTable() {
  let db;
  try {
    console.log('🔧 Connecting to MySQL database...');
    
    // สร้างการเชื่อมต่อฐานข้อมูล
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });

    console.log('✅ Connected to MySQL database');

    // ตรวจสอบว่าตาราง reviews มีอยู่แล้วหรือไม่
    const [tables] = await db.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'reviews'
    `, ['hotel_booking']);

    if (tables.length > 0) {
      console.log('✅ Reviews table already exists');
    } else {
      console.log('📦 Creating reviews table...');
      
      // สร้างตาราง reviews
      await db.execute(`
        CREATE TABLE reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          hotel_id INT NOT NULL,
          booking_id INT NULL,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          photos JSON,
          is_verified_stay BOOLEAN DEFAULT false,
          is_approved BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_hotel_id (hotel_id),
          INDEX idx_user_id (user_id),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      console.log('✅ Reviews table created successfully');
    }

    // เพิ่มข้อมูลตัวอย่าง
    console.log('📝 Adding sample reviews...');
    
    // ตรวจสอบว่ามีรีวิวอยู่แล้วหรือไม่
    const [existingReviews] = await db.execute('SELECT COUNT(*) as count FROM reviews');
    if (existingReviews[0].count === 0) {
      // เพิ่มรีวิวตัวอย่าง
      const sampleReviews = [
        {
          user_id: 1,
          hotel_id: 2, // ID ของโรงแรมวรุณภัฏ
          rating: 5,
          comment: 'โรงแรมสุดยอดมาก! บริการดีเยี่ยม ห้องพักสะอาด วิวสวย แนะนำเลยครับ 🏨✨',
          is_verified_stay: true
        },
        {
          user_id: 2,
          hotel_id: 2,
          rating: 4,
          comment: 'โดยรวมดีมาก สถานที่สวย วิวสวยมาก แต่อาจจะมีเสียงรบกวนนิดหน่อยตอนกลางคืน',
          is_verified_stay: false
        },
        {
          user_id: 3,
          hotel_id: 2,
          rating: 5,
          comment: 'พักมาหลายครั้งแล้ว ประทับใจทุกครั้ง บริการสุดยอด สิ่งอำนวยความสะดวกครบครัน 🏨✨',
          is_verified_stay: true
        }
      ];

      for (const review of sampleReviews) {
        await db.execute(`
          INSERT INTO reviews (user_id, hotel_id, rating, comment, is_verified_stay)
          VALUES (?, ?, ?, ?, ?)
        `, [review.user_id, review.hotel_id, review.rating, review.comment, review.is_verified_stay]);
      }
      
      console.log(`✅ Added ${sampleReviews.length} sample reviews`);
    } else {
      console.log('📋 Sample reviews already exist');
    }

    // ดึงรีวิวเพื่อทดสอบ
    console.log('\n📖 Testing review retrieval...');
    const [reviews] = await db.execute(`
      SELECT 
        r.id, r.rating, r.comment, r.is_verified_stay,
        r.created_at, u.first_name, u.last_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.hotel_id = 2 AND r.is_approved = true
      ORDER BY r.created_at DESC
    `);
    
    console.log(`✅ Found ${reviews.length} reviews:`);
    reviews.forEach((review, index) => {
      console.log(`   ${index + 1}. ${review.rating}/5 ⭐ by ${review.first_name} ${review.last_name}`);
      console.log(`      "${review.comment.substring(0, 60)}..."`);
    });

    console.log('\n🎉 Reviews system setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up reviews system:', error);
  } finally {
    if (db) {
      await db.end();
      console.log('🔒 Database connection closed');
    }
  }
}

createReviewsTable();