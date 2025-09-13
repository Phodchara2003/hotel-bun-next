// Using built-in fetch (Node.js 18+)
const testPaymentSettings = async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTc2NjU2ODksImV4cCI6MTc1ODI3MDQ4OX0.o-lr8bQT-_tZSYhCEqx_78B3MOhSXyTJ9AKE_JnpZ8c';
  
  console.log('Testing Payment Settings API...');
  
  try {
    // Test GET endpoint (correct path is /api/admin/payment-settings)
    console.log('\n1. Testing GET /api/admin/payment-settings');
    const getResponse = await fetch('http://localhost:3003/api/admin/payment-settings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('GET Status:', getResponse.status);
    console.log('GET Headers:', Object.fromEntries(getResponse.headers.entries()));
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('GET Data:', JSON.stringify(data, null, 2));
    } else {
      const error = await getResponse.text();
      console.log('GET Error:', error);
    }
    
  } catch (error) {
    console.error('Network Error:', error.message);
  }
};

testPaymentSettings();