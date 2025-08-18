import { sql } from './src/db/database.js';

async function testHotelAPI() {
  try {
    console.log('Testing hotel API logic...');
    
    // Test the exact query from hotels.js
    const hotelId = 1;
    
    console.log('1. Testing hotel query...');
    const hotel = await sql`
      SELECT * FROM hotels WHERE id = ${hotelId}
    `;
    console.log('Hotel result:', hotel);
    
    if (hotel.length === 0) {
      console.log('No hotel found, creating sample hotel...');
      
      await sql`
        INSERT INTO hotels (name, description, address, city, country, rating, images, amenities)
        VALUES (
          'Hotel Bun Next',
          'A modern and comfortable hotel with excellent service',
          '123 Main Street, Central District',
          'Bangkok',
          'Thailand',
          4.5,
          ARRAY['https://example.com/hotel1.jpg', 'https://example.com/hotel2.jpg'],
          ARRAY['WiFi', 'Pool', 'Gym', 'Restaurant', 'Spa']
        )
        ON CONFLICT (id) DO NOTHING
      `;
      
      // Try again
      const hotelRetry = await sql`
        SELECT * FROM hotels WHERE id = ${hotelId}
      `;
      console.log('Hotel after insert:', hotelRetry);
    }
    
    console.log('2. Testing room types query...');
    const roomTypes = await sql`
      SELECT * FROM room_types 
      WHERE hotel_id = ${hotelId}
      ORDER BY price_per_night ASC
    `;
    console.log('Room types:', roomTypes);
    
    console.log('3. Testing reviews query...');
    const reviews = await sql`
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.hotel_id = ${hotelId}
      ORDER BY r.created_at DESC
      LIMIT 10
    `;
    console.log('Reviews:', reviews);
    
    if (hotel.length > 0) {
      const hotelData = hotel[0];
      
      const result = {
        id: hotelData.id,
        name: hotelData.name,
        description: hotelData.description,
        address: hotelData.address,
        city: hotelData.city,
        country: hotelData.country,
        rating: parseFloat(hotelData.rating),
        images: hotelData.images,
        amenities: hotelData.amenities,
        roomTypes: roomTypes.map(rt => ({
          id: rt.id,
          name: rt.name,
          description: rt.description,
          pricePerNight: parseFloat(rt.price_per_night),
          maxGuests: rt.max_guests,
          sizeSqm: rt.size_sqm,
          amenities: rt.amenities,
          images: rt.images,
          image: rt.image
        })),
        reviews: reviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          userName: `${review.first_name} ${review.last_name}`,
          createdAt: review.created_at
        }))
      };
      
      console.log('4. Final result:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('Error in hotel API test:', error);
  } finally {
    process.exit(0);
  }
}

testHotelAPI();
