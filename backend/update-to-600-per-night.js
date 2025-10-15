// Update booking to 600 per night
import { sql } from './src/db/database.js';

async function updateTo600PerNight() {
  try {
    console.log('💰 Updating room price to 600 per night...');
    
    // Update room type price to 600 per night
    await sql`
      UPDATE room_types 
      SET price_per_night = 600.00 
      WHERE name LIKE '%Double Room%' OR name LIKE '%เตียงคู่%'
    `;
    
    // Update booking: 2 nights × 600 = 1200 total
    await sql`
      UPDATE bookings 
      SET 
        room_price = 600.00,
        total_price = 1200.00,
        nights = 2
      WHERE booking_reference = 'HTL800420'
    `;
    
    // Verify the update
    const booking = await sql`
      SELECT b.*, rt.price_per_night 
      FROM bookings b
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      WHERE b.booking_reference = 'HTL800420'
    `;
    
    if (booking.length > 0) {
      console.log('✅ Updated booking with 600/night:');
      console.log('- Room price per night:', booking[0].room_price);
      console.log('- Nights:', booking[0].nights);
      console.log('- Total price:', booking[0].total_price);
      console.log('- Room type price:', booking[0].price_per_night);
      console.log('- Calculation: 2 nights × ฿600 = ฿1,200');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating to 600/night:', error);
    process.exit(1);
  }
}

updateTo600PerNight();