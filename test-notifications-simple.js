const testNotificationsSimple = async () => {
  console.log('🧪 Testing Notifications...');
  
  try {
    // Let me try to create a simple request first to see if the endpoint responds
    console.log('Testing basic request without auth...');
    const responseNoAuth = await fetch('http://localhost:3003/api/notifications');
    console.log('No Auth Status:', responseNoAuth.status);
    const noAuthText = await responseNoAuth.text();
    console.log('No Auth Response:', noAuthText);
    
    // Now test with an auth header (even if token is invalid, should trigger auth middleware)
    console.log('\nTesting with auth header...');
    const responseWithAuth = await fetch('http://localhost:3003/api/notifications', {
      headers: {
        'Authorization': 'Bearer fake-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('With Auth Status:', responseWithAuth.status);
    const withAuthText = await responseWithAuth.text();
    console.log('With Auth Response:', withAuthText);
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
};

testNotificationsSimple();