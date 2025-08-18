// Test the hotel API directly
import('./frontend/lib/api.js').then(({ hotelAPI }) => {
  console.log('Testing hotel API...');
  
  hotelAPI.getHotelById(1)
    .then(data => {
      console.log('✅ Hotel API Success!');
      console.log('Hotel name:', data.name);
      console.log('Room types:', data.roomTypes?.length || 0);
    })
    .catch(error => {
      console.error('❌ Hotel API Error:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    });
}).catch(err => {
  console.error('❌ Import error:', err);
});
