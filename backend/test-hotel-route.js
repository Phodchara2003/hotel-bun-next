import { sql } from './src/db/database.js';

async function testHotelRoute() {
  try {
    console.log('Testing hotel route components...');
    
    const hotelId = 1;
    
    // Test 1: Get hotel data
    console.log('\n1. Testing hotel query...');
    const hotel = await sql`
      SELECT * FROM hotels WHERE id = ${hotelId}
    `;
    console.log('Hotel found:', hotel.length > 0);
    
    // Test 2: Get room types
    console.log('\n2. Testing room types query...');
    const roomTypes = await sql`
      SELECT * FROM room_types 
      WHERE hotel_id = ${hotelId}
      ORDER BY price_per_night ASC
    `;
    console.log('Room types found:', roomTypes.length);
    
    // Test 3: Get reviews with JOIN (this might be the problematic one)
    console.log('\n3. Testing reviews query...');
    const reviews = await sql`
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.hotel_id = ${hotelId}
      ORDER BY r.created_at DESC
      LIMIT 10
    `;
    console.log('Reviews found:', reviews.length);
    
    // Test 4: Try building the full response
    console.log('\n4. Testing full response construction...');
    const hotelData = hotel[0];
    
    const response = {
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
    
    console.log('Response size:', JSON.stringify(response).length, 'characters');
    console.log('Response constructed successfully!');
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    process.exit(0);
  }
}

testHotelRoute();
