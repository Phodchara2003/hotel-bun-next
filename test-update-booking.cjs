const axios = require('axios');

async function testUpdateBookingDates() {
  try {
    console.log('🧪 Testing booking dates update...');
    
    // ดูข้อมูล bookings ก่อน
    console.log('📋 Fetching current bookings...');
    const bookingsResponse = await axios.get(
      'http://localhost:3001/api/bookings',
      {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Current bookings:', bookingsResponse.data);
    
    if (bookingsResponse.data.success && bookingsResponse.data.data.length > 0) {
      const booking = bookingsResponse.data.data[0];
      console.log('Using booking ID:', booking.id);
      
      // Test data
      const testData = {
        action: 'update_dates',
        check_in_date: '2025-10-06',
        check_out_date: '2025-10-07'
      };
      
      console.log('📋 Test data:', testData);
      
      const response = await axios.put(
        `http://localhost:3001/api/bookings/${booking.id}`,
        testData,
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Response status:', response.status);
      console.log('📊 Response data:', response.data);
    } else {
      console.log('No bookings found to test with');
    }
    
  } catch (error) {
    console.error('❌ Error testing update:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testUpdateBookingDates();