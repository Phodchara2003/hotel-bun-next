const testNotificationsFixed = async () => {
  console.log('🧪 Testing Notifications with fixed auth...');
  
  try {
    // Use an existing valid token
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTc2NjU2ODksImV4cCI6MTc1ODI3MDQ4OX0.o-lr8bQT-_tZSYhCEqx_78B3MOhSXyTJ9AKE_JnpZ8c';
    
    console.log('Testing notifications endpoint...');
    const response = await fetch('http://localhost:3003/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.status === 200) {
      console.log('✅ Notifications API working!');
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed data:', data);
      } catch (e) {
        console.log('Response is not JSON');
      }
    } else {
      console.log('❌ Notifications API failed');
    }
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
};

testNotificationsFixed();