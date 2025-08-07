import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require'
});

async function updateReviewsTable() {
  try {
    console.log('🔧 Updating reviews table structure...');

    // ตรวจสอบคอลัมน์ที่มีอยู่
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reviews'
    `;
    
    const existingColumns = columns.map(col => col.column_name);
    console.log('📋 Existing columns:', existingColumns);

    // เพิ่มคอลัมน์ที่ขาดหายไป
    const requiredColumns = {
      'photos': 'JSONB DEFAULT \'[]\'',
      'is_verified_stay': 'BOOLEAN DEFAULT false',
      'is_approved': 'BOOLEAN DEFAULT true',
      'updated_at': 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP'
    };

    for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
      if (!existingColumns.includes(columnName)) {
        console.log(`➕ Adding column: ${columnName}`);
        await sql.unsafe(`ALTER TABLE reviews ADD COLUMN ${columnName} ${columnDef}`);
      } else {
        console.log(`✅ Column ${columnName} already exists`);
      }
    }

    // สร้าง indexes
    console.log('📊 Creating indexes...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_reviews_hotel_id ON reviews(hotel_id)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved)'
    ];

    for (const indexQuery of indexes) {
      try {
        await sql.unsafe(indexQuery);
      } catch (error) {
        console.log(`⚠️ Index may already exist: ${error.message}`);
      }
    }

    // สร้างตาราง review_reports หากยังไม่มี
    console.log('📦 Creating review_reports table...');
    try {
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
    } catch (error) {
      console.log('⚠️ review_reports table may already exist');
    }

    // เพิ่มคอลัมน์ใน hotels table
    console.log('🏨 Updating hotels table...');
    
    const hotelColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'hotels'
    `;
    
    const existingHotelColumns = hotelColumns.map(col => col.column_name);
    
    if (!existingHotelColumns.includes('review_count')) {
      console.log('➕ Adding review_count to hotels table');
      await sql`ALTER TABLE hotels ADD COLUMN review_count INTEGER DEFAULT 0`;
    }
    
    if (!existingHotelColumns.includes('average_rating')) {
      console.log('➕ Adding average_rating to hotels table');
      await sql`ALTER TABLE hotels ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.0`;
    }

    console.log('✅ Reviews table updated successfully!');

    // แสดงโครงสร้างตารางที่อัปเดตแล้ว
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'reviews'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Updated reviews table structure:');
    console.table(finalColumns);

    await sql.end();
    return true;
    
  } catch (error) {
    console.error('❌ Error updating reviews table:', error);
    await sql.end();
    throw error;
  }
}

// รันฟังก์ชัน
updateReviewsTable()
  .then(() => {
    console.log('\n✨ Reviews table update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed to update reviews table:', error);
    process.exit(1);
  });
