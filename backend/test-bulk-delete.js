// Test bulk delete functionality
const testBulkDelete = async () => {
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
    
    if (allBookings.totalBookings >= 3) {
      // Delete multiple bookings
      const bookingsToDelete = allBookings.bookings.slice(0, 3);
      console.log(`2. Deleting ${bookingsToDelete.length} bookings...`);
      
      for (const booking of bookingsToDelete) {
        console.log(`   Deleting booking ID: ${booking.id}`);
        const deleteResponse = await fetch(`${baseURL}/${booking.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer fake-token',
            'Content-Type': 'application/json'
          }
        });
        
        const deleteResult = await deleteResponse.json();
        console.log(`   Result: ${deleteResult.message}`);
      }
      
      // Check remaining bookings
      const remainingResponse = await fetch(`${baseURL}/admin/debug/all`, {
        headers: {
          'Authorization': 'Bearer fake-token',
          'Content-Type': 'application/json'
        }
      });
      
      const remainingBookings = await remainingResponse.json();
      console.log(`3. Remaining bookings: ${remainingBookings.totalBookings}`);
      
      const expectedRemaining = allBookings.totalBookings - bookingsToDelete.length;
      if (remainingBookings.totalBookings === expectedRemaining) {
        console.log('✅ Bulk delete working correctly!');
      } else {
        console.log('❌ Bulk delete not working properly');
      }
    } else {
      console.log('Not enough bookings for bulk delete test');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testBulkDelete();
