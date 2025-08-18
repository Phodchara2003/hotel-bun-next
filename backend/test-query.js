import { sql } from './src/db/database.js';

async function testQuery() {
  try {
    console.log('Testing simple query...');
    const simple = await sql`
      SELECT id, name, type, price_per_night 
      FROM room_types 
      WHERE hotel_id = 1
      ORDER BY price_per_night ASC
    `;
    console.log('Simple query works:', simple.length, 'rooms');

    console.log('Testing complex query...');
    const complex = await sql`
      SELECT id, name, description, price_per_night, max_guests, size_sqm, amenities, hotel_id, type,
             CASE 
               WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 
                 CASE 
                   WHEN images[1] NOT LIKE 'data:image%' THEN images
                   ELSE array_length(images, 1)
                 END
               ELSE NULL
             END as image_info
      FROM room_types 
      WHERE hotel_id = 1
      ORDER BY price_per_night ASC
    `;
    console.log('Complex query works:', complex.length, 'rooms');
    complex.forEach(room => {
      console.log(`Room ${room.id}: ${room.name}, image_info:`, typeof room.image_info, room.image_info);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

testQuery();
