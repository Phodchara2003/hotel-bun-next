// Test admin API endpoints
const testAdminAPI = async () => {
  try {
    const adminToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTYxMTM4MTQsImV4cCI6MTc1NjcxODYxNH0.pG0fEFjUcUOv0tszlZ9qqxf_UNoyJaiWPC0LLXEgTKQ';
    
    console.log('Testing admin bookings API...');
    
    // Test admin bookings endpoint
    const response = await fetch('http://localhost:3001/api/bookings/admin/all', {
      headers: {
        'Authorization': adminToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin API working! Found', data.bookings?.length || 0, 'bookings');
      
      if (data.bookings && data.bookings.length > 0) {
        console.log('Sample booking:', {
          id: data.bookings[0].id,
          status: data.bookings[0].status,
          totalPrice: data.bookings[0].totalPrice
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing admin API:', error.message);
  }
};

testAdminAPI();
