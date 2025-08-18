import { sql } from './src/db/database.js';

async function checkRoom() {
  try {
    const room = await sql`
      SELECT id, name, 
             CASE WHEN image IS NULL THEN 0 ELSE LENGTH(image) END as image_size,
             CASE WHEN images IS NULL THEN 0 ELSE array_length(images, 1) END as images_count
      FROM room_types 
      WHERE id = 7
    `;
    console.log('Room 7 data:', room[0]);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkRoom();
