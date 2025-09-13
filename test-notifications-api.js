const testNotificationsAPI = async () => {
  console.log('🧪 Testing Notifications API...');
  
  try {
    // First, let's get a valid token by logging in
    const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@hotel.com',
        password: 'admin123'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login result:', loginResult);
    
    if (loginResult.success && loginResult.token) {
      console.log('✅ Login successful, testing notifications API...');
      
      // Now test notifications API with the token
      const notificationsResponse = await fetch('http://localhost:3003/api/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginResult.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Notifications API Status:', notificationsResponse.status);
      console.log('Notifications API Headers:', Object.fromEntries(notificationsResponse.headers.entries()));
      
      const notificationsResult = await notificationsResponse.text();
      console.log('Notifications API Response:', notificationsResult);
      
      if (notificationsResponse.status === 200) {
        console.log('✅ Notifications API working!');
      } else {
        console.log('❌ Notifications API failed');
      }
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testNotificationsAPI();