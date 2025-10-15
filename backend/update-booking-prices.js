// Update sample booking with correct prices
import { sql } from './src/db/database.js';

async function updateBookingPrices() {
  try {
    console.log('💰 Updating booking prices to match your scenario...');
    
    // Update room type price to 300 per night
    await sql`
      UPDATE room_types 
      SET price_per_night = 300.00 
      WHERE name LIKE '%Double Room%' OR name LIKE '%เตียงคู่%'
    `;
    
    // Update booking to have correct prices for your scenario
    // 2 nights × 300 = 600 total
    await sql`
      UPDATE bookings 
      SET 
        room_price = 300.00,
        total_price = 600.00,
        nights = 2,
        check_in_date = '2025-10-15',
        check_out_date = '2025-10-17'
      WHERE booking_reference = 'HTL800420'
    `;
    
    // Verify the update
    const booking = await sql`
      SELECT * FROM bookings WHERE booking_reference = 'HTL800420'
    `;
    
    if (booking.length > 0) {
      console.log('✅ Updated booking:');
      console.log('- Room price per night:', booking[0].room_price);
      console.log('- Nights:', booking[0].nights);
      console.log('- Total price:', booking[0].total_price);
      console.log('- Check-in:', booking[0].check_in_date);
      console.log('- Check-out:', booking[0].check_out_date);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating prices:', error);
    process.exit(1);
  }
}

updateBookingPrices();