import { hotelAPI } from '../lib/api.js';

async function testAPI() {
  try {
    console.log('Testing Hotel API...');
    
    // Test get hotel by ID
    console.log('Fetching hotel data for ID 1...');
    const hotel = await hotelAPI.getHotelById(1);
    console.log('Hotel data:', hotel);
    console.log('Room types count:', hotel.roomTypes ? hotel.roomTypes.length : 0);
    
    if (hotel.roomTypes && hotel.roomTypes.length > 0) {
      console.log('First room type:', hotel.roomTypes[0]);
    }
    
  } catch (error) {
    console.error('API Test Error:', error);
    console.error('Error details:', error.response?.data);
  }
}

// Test in browser console
if (typeof window !== 'undefined') {
  window.testAPI = testAPI;
  console.log('Use window.testAPI() to test the API');
}

export default testAPI;
