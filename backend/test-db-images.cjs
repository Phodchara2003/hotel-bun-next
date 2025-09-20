const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '12345678',
  database: 'hotel_booking',
};

async function testDatabaseImages() {
  let connection;
  try {
    console.log('🔄 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database successfully!');

    // ดึงข้อมูลดิบจาก room_types
    console.log('\n📋 Raw data from room_types table:');
    const [rows] = await connection.execute(`
      SELECT id, name, amenities, images 
      FROM room_types 
      WHERE id IN (4, 5)
    `);

    rows.forEach(row => {
      console.log(`\n🏠 Room ID: ${row.id}, Name: ${row.name}`);
      console.log(`📝 Amenities (raw):`, row.amenities);
      console.log(`📝 Amenities (type):`, typeof row.amenities);
      console.log(`🖼️ Images (raw):`, row.images);
      console.log(`🖼️ Images (type):`, typeof row.images);
      
      // พยายาม parse JSON
      if (row.amenities) {
        try {
          const parsedAmenities = JSON.parse(row.amenities);
          console.log(`✅ Parsed amenities:`, parsedAmenities);
        } catch (e) {
          console.log(`❌ Failed to parse amenities:`, e.message);
        }
      }
      
      if (row.images) {
        try {
          const parsedImages = JSON.parse(row.images);
          console.log(`✅ Parsed images:`, parsedImages);
        } catch (e) {
          console.log(`❌ Failed to parse images:`, e.message);
        }
      }
    });

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testDatabaseImages();