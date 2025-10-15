// Test script to check booking data structure
import { sql } from './src/db/database.js';

async function checkBookingData() {
  try {
    console.log('🔍 Checking booking data structure...');
    
    // Get all bookings
    const bookings = await sql`
      SELECT b.*, rt.price_per_night, rt.name as room_type_name
      FROM bookings b
      LEFT JOIN room_types rt ON b.room_type_id = rt.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `;
    
    console.log(`📊 Found ${bookings.length} bookings`);
    
    if (bookings.length > 0) {
      bookings.forEach((booking, index) => {
        console.log(`\n--- Booking ${index + 1} ---`);
        console.log('ID:', booking.id);
        console.log('Status:', booking.status);
        console.log('Room price (from booking):', booking.room_price);
        console.log('Room price (from room_type):', booking.price_per_night);
        console.log('Total price:', booking.total_price);
        console.log('Nights:', booking.nights);
        console.log('Check-in:', booking.check_in_date);
        console.log('Check-out:', booking.check_out_date);
        
        if (booking.room_price && booking.nights) {
          const calculatedPrice = booking.room_price * booking.nights;
          console.log('Calculated total (room_price * nights):', calculatedPrice);
          console.log('Matches stored total?', calculatedPrice === parseFloat(booking.total_price));
        }
      });
    } else {
      console.log('❌ No bookings found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBookingData();