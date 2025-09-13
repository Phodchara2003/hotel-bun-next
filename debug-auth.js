const testAuth = async () => {
  console.log('🔍 Debugging authentication...');
  
  try {
    // Test 1: Check if server is responding
    console.log('\n1. Testing server health...');
    const healthResponse = await fetch('http://localhost:3003/');
    console.log('Server response:', healthResponse.status);
    
    // Test 2: Try login with simple credentials
    console.log('\n2. Testing login endpoint...');
    const loginData = {
      email: 'admin@hotel.com',
      password: 'admin123'
    };
    
    const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('Login Status:', loginResponse.status);
    console.log('Login Headers:', Object.fromEntries(loginResponse.headers));
    
    const loginText = await loginResponse.text();
    console.log('Login Response Body:', loginText);
    
    // Try to parse as JSON
    try {
      const loginJson = JSON.parse(loginText);
      console.log('Login JSON:', loginJson);
      
      if (loginJson.token) {
        console.log('\n3. Testing token with notifications...');
        const notifResponse = await fetch('http://localhost:3003/api/notifications', {
          headers: {
            'Authorization': `Bearer ${loginJson.token}`
          }
        });
        console.log('Notifications Status:', notifResponse.status);
        const notifText = await notifResponse.text();
        console.log('Notifications Response:', notifText);
      }
    } catch (e) {
      console.log('Failed to parse login response as JSON');
    }
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
};

testAuth();