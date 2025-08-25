// Test frontend API configuration
console.log('=== Frontend API Configuration Test ===');

// Test environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
console.log('API URL:', API_URL);

// Test axios configuration (simulate)
const testAPIConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/api/bookings/admin/all`, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTYxMTM4MTQsImV4cCI6MTc1NjcxODYxNH0.pG0fEFjUcUOv0tszlZ9qqxf_UNoyJaiWPC0LLXEgTKQ',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Frontend can connect to backend API');
      console.log('✅ Found', data.bookings?.length || 0, 'bookings');
    } else {
      console.log('❌ API connection failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

testAPIConnection();
