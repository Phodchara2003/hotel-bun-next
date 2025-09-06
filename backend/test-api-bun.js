// Test API using bun
const response = await fetch('http://localhost:3002/health');
if (response.ok) {
  const data = await response.text();
  console.log('✅ Health check successful:', data);
} else {
  console.log('❌ Health check failed:', response.status);
}

// Test login
try {
  const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'super@admin.com',
      password: 'superadmin123'
    })
  });
  
  if (loginResponse.ok) {
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Test payments API
    const paymentsResponse = await fetch('http://localhost:3002/api/admin/payments', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      console.log('✅ Payments API working!');
      console.log('Total payments:', paymentsData.payments?.length || 0);
      console.log('Sample payment:', paymentsData.payments?.[0] || 'No payments');
    } else {
      console.log('❌ Payments API failed:', paymentsResponse.status);
      const errorData = await paymentsResponse.text();
      console.log('Error:', errorData);
    }
    
  } else {
    console.log('❌ Login failed:', loginResponse.status);
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
