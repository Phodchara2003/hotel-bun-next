import { sql } from './src/db/database.js';

async function checkLargeData() {
  try {
    const roomTypes = await sql`SELECT id, name, images FROM room_types WHERE hotel_id = 1`;
    
    roomTypes.forEach(rt => {
      const imagesSize = rt.images ? JSON.stringify(rt.images).length : 0;
      console.log(`Room ${rt.id} (${rt.name}): images field = ${imagesSize} characters`);
      
      if (rt.images && Array.isArray(rt.images)) {
        rt.images.forEach((img, idx) => {
          console.log(`  Image ${idx}: ${img.length} characters`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkLargeData();
