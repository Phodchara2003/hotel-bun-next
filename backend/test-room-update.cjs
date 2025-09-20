const mysql = require('mysql2/promise');

async function testRoomUpdate() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '12345678',
      database: 'hotel_booking'
    });

    // Test parameters (same structure as in updateRoom)
    const updateParams = [
      2,           // finalHotelId (use existing hotel)
      'Test Room', // safeName
      'Test Desc', // safeDescription
      1500.0,      // safePricePerNight
      2,           // safeMaxGuests
      25.5,        // safeSizeSquareMeters
      '["wifi"]',  // safeAmenities (JSON string)
      null,        // safeImages
      'deluxe',    // safeType
      4            // roomId (using existing room)
    ];

    console.log('🔧 Test parameters:', updateParams);
    console.log('🔧 Parameter count:', updateParams.length);
    console.log('🔧 Parameter types:', updateParams.map(p => typeof p));

    const result = await connection.execute(`
      UPDATE room_types SET
        hotel_id = ?,
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price_per_night = COALESCE(?, price_per_night),
        max_guests = COALESCE(?, max_guests),
        size_sqm = COALESCE(?, size_sqm),
        amenities = COALESCE(?, amenities),
        images = COALESCE(?, images),
        type = COALESCE(?, type),
        updated_at = NOW()
      WHERE id = ?
    `, updateParams);

    console.log('✅ Update successful:', result);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testRoomUpdate();