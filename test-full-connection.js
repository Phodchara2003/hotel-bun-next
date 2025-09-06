// Test with real authentication
const testWithAuth = async () => {
  console.log('🔐 Testing with Authentication...');
  
  try {
    // First, login to get a valid token
    console.log('1. 🚪 Attempting login...');
    
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@hotel.com',
        password: 'admin123'
      })
    });
    
    console.log('📡 Login Response Status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const loginError = await loginResponse.text();
      console.log('❌ Login Failed:', loginError);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login Success!');
    console.log('👤 User:', loginData.user?.username);
    console.log('🎭 Role:', loginData.user?.role);
    
    const token = loginData.token;
    console.log('🔑 Token received:', token ? 'Yes' : 'No');
    
    // Now test users API with valid token
    console.log('\n2. 👥 Testing Users API...');
    
    const usersResponse = await fetch('http://localhost:3002/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📡 Users API Response Status:', usersResponse.status);
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users API Working!');
      console.log('👥 Total Users:', usersData.users?.length || 0);
      
      if (usersData.users?.length > 0) {
        console.log('📋 Sample Users:');
        usersData.users.slice(0, 3).forEach(user => {
          console.log(`  - ${user.first_name} ${user.last_name} (${user.email}) [${user.role}]`);
        });
      }
      
      console.log('\n🎉 Frontend-Backend Connection: SUCCESS!');
      console.log('🔗 API Endpoints Working:');
      console.log('  ✅ POST /api/auth/login');
      console.log('  ✅ GET /api/admin/users');
      
    } else {
      const usersError = await usersResponse.text();
      console.log('❌ Users API Error:', usersError);
    }
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
};

// Run test
testWithAuth();
