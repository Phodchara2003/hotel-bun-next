// Test frontend API configuration
console.log('=== Frontend API Configuration Test ===');

// Test environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
console.log('API URL:', API_URL);

// Test axios configuration (simulate)
const testAPIConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/api/hotels`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Frontend can connect to backend API');
      console.log('✅ Found', data.data?.length || 0, 'hotels');
    } else {
      console.log('❌ API connection failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

testAPIConnection();
