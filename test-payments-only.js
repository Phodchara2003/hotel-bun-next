import axios from 'axios';

const API_BASE = 'http://localhost:3002/api';

async function testPaymentsAPI() {
  try {
    console.log('🧪 Testing Payments API...');
    
    // Login first
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@hotel.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test Payments API
    const paymentsResponse = await axios.get(`${API_BASE}/admin/payments`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Payments API Status:', paymentsResponse.status);
    console.log('📊 Payments Count:', paymentsResponse.data.payments?.length || 0);
    
  } catch (error) {
    console.log('❌ Payments API Error:', error.response?.status);
    console.log('📝 Error Details:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('🔍 This is likely a database schema issue');
    }
  }
}

testPaymentsAPI();
