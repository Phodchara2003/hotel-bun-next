// Quick test for Payments API only
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002/api';

async function testPaymentsAPIQuick() {
  try {
    console.log('\n🔍 Testing Payments API after schema fixes...\n');
    
    // Login first
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'super@admin.com',
      password: 'superadmin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test GET payments list
    console.log('\n📋 Testing GET /admin/payments...');
    const paymentsResponse = await axios.get(`${API_BASE_URL}/admin/payments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Payments API working!');
    console.log('Status:', paymentsResponse.status);
    console.log('Response structure:', {
      totalPayments: paymentsResponse.data.payments?.length || 0,
      pagination: paymentsResponse.data.pagination
    });
    
    if (paymentsResponse.data.payments?.length > 0) {
      console.log('Sample payment fields:', Object.keys(paymentsResponse.data.payments[0]));
      
      console.log('\n📄 Testing GET payment by ID...');
      const firstPaymentId = paymentsResponse.data.payments[0].id;
      
      const paymentResponse = await axios.get(`${API_BASE_URL}/admin/payments/${firstPaymentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Payment by ID working!');
      console.log('Status:', paymentResponse.status);
      console.log('Payment details fields:', Object.keys(paymentResponse.data.payment));
    }
    
    console.log('\n🎉 Payments API is now working!\n');
    
  } catch (error) {
    console.error('\n❌ Payments API Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testPaymentsAPIQuick();
