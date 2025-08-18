import { sql } from './src/db/database.js';

async function testHotelAPI() {
  try {
    console.log('Testing hotel API endpoint manually...');
    
    // Simulate the exact API call
    const hotelId = 1;
    
    const hotel = await sql`
      SELECT * FROM hotels WHERE id = ${hotelId}
    `;
    
    if (!hotel.length) {
      console.log('❌ Hotel not found');
      return;
    }

    // Get room types for this hotel (exclude large base64 images)
    const roomTypes = await sql`
      SELECT id, name, description, price_per_night, max_guests, size_sqm, amenities, hotel_id
      FROM room_types 
      WHERE hotel_id = ${hotelId}
      ORDER BY price_per_night ASC
    `;

    // Get reviews for this hotel
    const reviews = await sql`
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.hotel_id = ${hotelId}
      ORDER BY r.created_at DESC
      LIMIT 10
    `;

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
        amenities: rt.amenities
      })),
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        userName: review.first_name && review.last_name ? `${review.first_name} ${review.last_name}` : 'Anonymous User',
        createdAt: review.created_at
      }))
    };
    
    console.log('✅ Hotel API test successful!');
    console.log('Hotel:', result.name);
    console.log('Room types:', result.roomTypes.length);
    console.log('Reviews:', result.reviews.length);
    console.log('Response size:', JSON.stringify(result).length, 'characters');
    
    if (JSON.stringify(result).length > 1000000) {
      console.log('⚠️  Response size is still large!');
    } else {
      console.log('✅ Response size is reasonable');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testHotelAPI();
