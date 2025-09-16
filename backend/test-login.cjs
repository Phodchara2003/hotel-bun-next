const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Testing login API...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@hotel.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full response:', error.response?.data);
  }
}

testLogin();