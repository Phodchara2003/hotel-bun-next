// Test script to check token persistence and API authentication
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function testLogin() {
  try {
    console.log('🔐 Testing login...');
    
    // Test login with admin credentials
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@hotel.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful:', loginResponse.data);
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('🎫 Token:', token);
    console.log('👤 User:', user);
    
    // Test token verification
    console.log('\n🔍 Testing token verification...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/api/auth/verify`, {
      token: token
    });
    
    console.log('✅ Token verification:', verifyResponse.data);
    
    // Test rooms API with token
    console.log('\n🏨 Testing rooms API...');
    const roomsResponse = await axios.get(`${API_BASE_URL}/api/admin/rooms`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Rooms API successful:', roomsResponse.data.success);
    console.log('📊 Total rooms:', roomsResponse.data.data?.length || 0);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLogin();