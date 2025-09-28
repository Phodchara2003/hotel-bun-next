const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root', 
  password: '12345678',
  database: 'hotel_booking'
};

async function fixRoomImages() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get all room types with images
    const [rows] = await connection.execute('SELECT id, name, images FROM room_types');
    console.log(`📊 Found ${rows.length} room types to check`);
    
    for (const room of rows) {
      console.log(`\n🏠 Processing room ${room.id}: ${room.name}`);
      console.log(`Current images: ${room.images}`);
      
      let images = room.images || '';
      let processedImages = [];
      
      // Handle different image data formats
      if (typeof images === 'string' && images.trim()) {
        // Clean up comma-separated string
        processedImages = images
          .split(',')
          .map(img => img.trim())
          .filter(img => img && img !== '')
          .map(img => {
            // Ensure proper path format
            if (img.startsWith('room-')) {
              return `/uploads/room-images/${img}`;
            } else if (img.includes('room-images/')) {
              return img.startsWith('/uploads/') ? img : `/uploads/${img}`;
            } else {
              return `/uploads/room-images/${img}`;
            }
          });
      } else if (typeof images === 'object' && images !== null) {
        // Handle array or object format
        try {
          const imageArray = Array.isArray(images) ? images : [images];
          processedImages = imageArray
            .flat()
            .filter(img => img && typeof img === 'string')
            .map(img => img.startsWith('/uploads/') ? img : `/uploads/room-images/${img}`);
        } catch (e) {
          console.log(`Error processing images object:`, e.message);
        }
      }
      
      // Add default image if no images found
      if (processedImages.length === 0) {
        processedImages = ['/uploads/room-images/default-room.jpg'];
      }
      
      // Convert to JSON string for database storage
      const imagesJson = JSON.stringify(processedImages);
      
      console.log(`Processed images:`, processedImages);
      console.log(`JSON for database:`, imagesJson);
      
      // Update database
      await connection.execute(
        'UPDATE room_types SET images = ? WHERE id = ?',
        [imagesJson, room.id]
      );
      
      console.log(`✅ Updated room ${room.id}`);
    }
    
    console.log('\n🎉 All room images have been processed and updated!');
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixRoomImages();