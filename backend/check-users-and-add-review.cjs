const mysql = require('mysql2/promise');

async function checkUsers() {
  let db;
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });

    console.log('🔍 Checking existing users...');
    const [users] = await db.execute('SELECT id, email, first_name, last_name FROM users ORDER BY id LIMIT 10');
    
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}`);
    });

    if (users.length > 0) {
      console.log('\n📝 Adding sample review with existing user...');
      
      const [existingReviews] = await db.execute('SELECT COUNT(*) as count FROM reviews');
      if (existingReviews[0].count === 0) {
        // ใช้ user_id ที่มีอยู่จริง
        const firstUserId = users[0].id;
        
        await db.execute(`
          INSERT INTO reviews (user_id, hotel_id, rating, comment, is_verified_stay)
          VALUES (?, 2, 5, 'โรงแรมสุดยอดมาก! บริการดีเยี่ยม ห้องพักสะอาด วิวสวย แนะนำเลยครับ 🏨✨', true)
        `, [firstUserId]);
        
        console.log('✅ Sample review added successfully');
      } else {
        console.log('📋 Reviews already exist');
      }
    }

    // ตรวจสอบ reviews ที่มีอยู่
    console.log('\n📖 Current reviews:');
    const [reviews] = await db.execute(`
      SELECT r.id, r.rating, r.comment, r.user_id, u.first_name, u.last_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);
    
    reviews.forEach((review, index) => {
      console.log(`   ${index + 1}. ${review.rating}/5 ⭐ by ${review.first_name} ${review.last_name} (User ID: ${review.user_id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (db) {
      await db.end();
    }
  }
}

checkUsers();