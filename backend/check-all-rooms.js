import { sql } from './src/db/database.js';

async function checkAllRooms() {
  try {
    const rooms = await sql`
      SELECT id, name, type, 
             CASE WHEN images IS NULL THEN 0 ELSE array_length(images, 1) END as images_count,
             amenities,
             price_per_night
      FROM room_types 
      ORDER BY id
    `;
    console.log('All rooms in database:');
    rooms.forEach(room => {
      console.log(`- ID: ${room.id}, Name: "${room.name}", Type: "${room.type}", Images: ${room.images_count}, Price: ${room.price_per_night}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAllRooms();
