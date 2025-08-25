// Simple API test
const testAPI = async () => {
  try {
    console.log('Testing API connection...');
    
    // Test without auth first
    const response = await fetch('http://localhost:3001/swagger');
    console.log('Swagger response status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Backend is running and accessible');
    } else {
      console.log('❌ Backend is not responding correctly');
    }
    
  } catch (error) {
    console.error('❌ Error connecting to backend:', error.message);
  }
};

testAPI();
