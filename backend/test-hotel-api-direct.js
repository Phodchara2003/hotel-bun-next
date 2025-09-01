import { sql } from './src/db/database.js';

async function testHotelAPI() {
  try {
    console.log('Testing hotel API logic...');
    
    // Simulate the exact query from hotels.js
    const hotelId = 1;
    
    // Get hotel data
    const hotel = await sql`
      SELECT id, name, description, address, city, country, rating, amenities, created_at, updated_at
      FROM hotels WHERE id = ${hotelId}
    `;
    
    console.log('Hotel query result:', hotel);
    
    if (!hotel.length) {
      console.log('Hotel not found');
      return;
    }
    
    // Get room types
    const roomTypes = await sql`
      SELECT id, name, description, price_per_night, max_guests, size_sqm, amenities, hotel_id, type
      FROM room_types 
      WHERE hotel_id = ${hotelId}
      ORDER BY price_per_night ASC
    `;
    
    console.log('Room types query result:', roomTypes);
    
    // Build response like the API
    const hotelData = hotel[0];
    const response = {
      id: hotelData.id,
      name: hotelData.name,
      description: hotelData.description,
      address: hotelData.address,
      city: hotelData.city,
      country: hotelData.country,
      rating: parseFloat(hotelData.rating),
      images: [],
      amenities: hotelData.amenities,
      roomTypes: roomTypes.map(rt => ({
        id: rt.id,
        name: rt.name,
        type: rt.type,
        description: rt.description,
        pricePerNight: parseFloat(rt.price_per_night),
        maxGuests: rt.max_guests,
        sizeSqm: rt.size_sqm,
        amenities: rt.amenities,
        images: [`/api/hotels/room-image/${rt.id}/0`]
      })),
      reviews: []
    };
    
    console.log('Final API response:', JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

testHotelAPI();
