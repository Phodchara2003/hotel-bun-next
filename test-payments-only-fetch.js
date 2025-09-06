// Test Payments API only
console.log('🧪 Payments API Testing - เริ่มทดสอบ Payments API\n');

const API_BASE = 'http://localhost:3002/api';

// Test API endpoint
const testAPI = async (method, endpoint, data = null, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const responseData = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }
    
    return {
      status: response.status,
      success: response.ok,
      data: parsedData
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
};

// Test payments API only
const testPaymentsAPI = async () => {
  console.log('🔑 Testing Authentication...');
  
  // Login first
  const loginResult = await testAPI('POST', '/auth/login', {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  
  if (!loginResult.success) {
    console.log('❌ Login failed:', loginResult);
    return;
  }
  
  const token = loginResult.data.token;
  console.log('✅ Login successful\n');
  
  console.log('💰 Testing Payments API...');
  
  // Test GET payments list
  console.log('📋 GET /admin/payments - List payments');
  const paymentsResult = await testAPI('GET', '/admin/payments', null, token);
  console.log('Status:', paymentsResult.status);
  console.log('Success:', paymentsResult.success);
  
  if (paymentsResult.success) {
    console.log('✅ Payments list working!');
    console.log('Total payments:', paymentsResult.data.payments?.length || 0);
    console.log('Sample fields:', paymentsResult.data.payments?.[0] ? Object.keys(paymentsResult.data.payments[0]) : []);
    console.log('Pagination:', paymentsResult.data.pagination);
    
    // Test GET payment by ID if there are payments
    if (paymentsResult.data.payments?.length > 0) {
      const firstPaymentId = paymentsResult.data.payments[0].id;
      
      console.log('\n📄 GET /admin/payments/:id - Get payment details');
      const paymentResult = await testAPI('GET', `/admin/payments/${firstPaymentId}`, null, token);
      console.log('Status:', paymentResult.status);
      console.log('Success:', paymentResult.success);
      
      if (paymentResult.success) {
        console.log('✅ Payment details working!');
        console.log('Payment fields:', Object.keys(paymentResult.data.payment));
      } else {
        console.log('❌ Payment details failed:', paymentResult.data);
      }
    }
  } else {
    console.log('❌ Payments list failed:', paymentsResult.data);
  }
  
  // Test payment stats
  console.log('\n📊 GET /admin/payments/stats/overview - Payment statistics');
  const statsResult = await testAPI('GET', '/admin/payments/stats/overview', null, token);
  console.log('Status:', statsResult.status);
  console.log('Success:', statsResult.success);
  
  if (statsResult.success) {
    console.log('✅ Payment stats working!');
    console.log('Stats:', statsResult.data.stats);
  } else {
    console.log('❌ Payment stats failed:', statsResult.data);
  }
  
  console.log('\n🎉 Payments API testing complete!\n');
};

testPaymentsAPI();
