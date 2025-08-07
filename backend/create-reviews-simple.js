import { sql } from './src/db/database.js';

const createReviewTables = async () => {
  try {
    console.log('🚀 Starting review system table creation...');

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
    console.log('✅ Reviews table created successfully');

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
    console.log('✅ Review reports table created successfully');

    // สร้าง indexes
    console.log('📊 Creating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_hotel_id ON reviews(hotel_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved)`;
    
    console.log('✅ Indexes created successfully');

    // เพิ่มคอลัมน์ review_count และ average_rating ให้ตาราง hotels
    console.log('🏨 Updating hotels table...');
    
    try {
      await sql`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0`;
      await sql`ALTER TABLE hotels ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.0`;
      console.log('✅ Hotels table updated with review columns');
    } catch (error) {
      console.log('⚠️ Hotels columns may already exist:', error.message);
    }

    console.log('🎉 All review system tables created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error creating review tables:', error);
    throw error;
  }
};

// รันฟังก์ชันเมื่อไฟล์นี้ถูกเรียกใช้โดยตรง
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔧 Setting up review system...\n');
  
  createReviewTables()
    .then(() => {
      console.log('\n✨ Review system setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to setup review system:', error);
      process.exit(1);
    });
}

export { createReviewTables };
