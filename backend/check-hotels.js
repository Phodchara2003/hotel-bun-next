import { sql } from './src/db/database.js';

async function checkHotels() {
  try {
    const hotels = await sql`
      SELECT id, name, description, city, country, rating
      FROM hotels 
      ORDER BY id
    `;
    console.log('All hotels in database:');
    hotels.forEach(hotel => {
      console.log(`- ID: ${hotel.id}, Name: "${hotel.name}", City: "${hotel.city}", Rating: ${hotel.rating}`);
    });

    // Also check room types for each hotel
    for (const hotel of hotels) {
      const rooms = await sql`
        SELECT id, name, type, price_per_night, max_guests
        FROM room_types 
        WHERE hotel_id = ${hotel.id}
        ORDER BY price_per_night
      `;
      console.log(`\nRooms for Hotel ${hotel.id} (${hotel.name}):`);
      if (rooms.length === 0) {
        console.log('  No rooms found');
      } else {
        rooms.forEach(room => {
          console.log(`  - ${room.name} (${room.type}): ฿${room.price_per_night}/night, Max guests: ${room.max_guests}`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkHotels();
