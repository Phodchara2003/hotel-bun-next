// Test script to verify booking deletion functionality
const testBookingDeletion = async () => {
  const baseURL = 'http://localhost:3002/api/bookings';
  
  try {
    // Get all bookings first
    console.log('1. Getting all bookings...');
    const getAllResponse = await fetch(`${baseURL}/admin/debug/all`, {
      headers: {
        'Authorization': 'Bearer fake-token',
        'Content-Type': 'application/json'
      }
    });
    
    const allBookings = await getAllResponse.json();
    console.log(`Found ${allBookings.totalBookings} bookings`);
    
    if (allBookings.totalBookings > 0) {
      const firstBookingId = allBookings.bookings[0].id;
      console.log(`2. Deleting booking ID: ${firstBookingId}`);
      
      // Delete one booking
      const deleteResponse = await fetch(`${baseURL}/${firstBookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer fake-token',
          'Content-Type': 'application/json'
        }
      });
      
      const deleteResult = await deleteResponse.json();
      console.log('Delete result:', deleteResult);
      
      // Check remaining bookings
      const remainingResponse = await fetch(`${baseURL}/admin/debug/all`, {
        headers: {
          'Authorization': 'Bearer fake-token',
          'Content-Type': 'application/json'
        }
      });
      
      const remainingBookings = await remainingResponse.json();
      console.log(`3. Remaining bookings: ${remainingBookings.totalBookings}`);
      
      if (remainingBookings.totalBookings === allBookings.totalBookings - 1) {
        console.log('✅ DELETE endpoint working correctly!');
      } else {
        console.log('❌ DELETE endpoint not working properly');
      }
    } else {
      console.log('No bookings found to delete');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testBookingDeletion();
