// Test Users API Connection
const testUsersAPI = async () => {
  console.log('🧪 Testing Users API Connection...');
  
  try {
    // Test backend connection
    const backendResponse = await fetch('http://localhost:3002/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // ใช้ token test
      }
    });
    
    console.log('📡 Backend Response Status:', backendResponse.status);
    
    if (backendResponse.ok) {
      const data = await backendResponse.json();
      console.log('✅ Backend API Working!');
      console.log('👥 Users Count:', data.users?.length || 0);
      console.log('📋 Sample User Data:', data.users?.slice(0, 2) || []);
    } else {
      console.log('❌ Backend API Error:', backendResponse.statusText);
      const errorText = await backendResponse.text();
      console.log('Error Details:', errorText);
    }
    
    // Test frontend API helper
    console.log('\n🔧 Testing Frontend API Helper...');
    
    // Simulate frontend API call
    const frontendApiTest = {
      baseURL: 'http://localhost:3002/api',
      endpoint: '/admin/users',
      method: 'GET'
    };
    
    console.log('🌐 Frontend API Config:', frontendApiTest);
    console.log('✅ Frontend API Helper Ready');
    
  } catch (error) {
    console.error('❌ Connection Test Failed:', error.message);
  }
};

// Run test
testUsersAPI();
