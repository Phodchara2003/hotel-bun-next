import { sql } from './src/db/database.js';

async function checkImageSizes() {
  try {
    const roomTypes = await sql`SELECT id, name, image FROM room_types WHERE hotel_id = 1`;
    
    roomTypes.forEach(rt => {
      const imageSize = rt.image ? rt.image.length : 0;
      console.log(`Room ${rt.id} (${rt.name}): ${imageSize} characters`);
      
      if (rt.image && rt.image.startsWith('data:image')) {
        const sizeInMB = (imageSize / 1024 / 1024).toFixed(2);
        console.log(`  → Base64 image size: ${sizeInMB} MB`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkImageSizes();
