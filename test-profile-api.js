const API_BASE_URL = 'http://localhost:3002';

// Test Profile API
async function testProfileAPI() {
  console.log('🧪 Testing Profile API...');
  
  try {
    // First login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@royalgarden.com',
        password: 'admin123'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('✅ Login Response:', loginResult);
    
    if (!loginResult.token) {
      throw new Error('Login failed - no token received');
    }
    
    const token = loginResult.token;
    
    // Test GET Profile
    console.log('\n📋 Testing GET Profile...');
    const getProfileResponse = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const getProfileResult = await getProfileResponse.json();
    console.log('✅ GET Profile Response:', getProfileResult);
    
    // Test PUT Profile Update
    console.log('\n✏️ Testing PUT Profile Update...');
    const updateData = {
      first_name: 'Admin Updated',
      last_name: 'Manager Updated',
      email: 'admin@royalgarden.com',
      phone: '0812345678',
      username: 'admin_updated',
      address: '123 Updated Street, Bangkok'
    };
    
    const updateProfileResponse = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const updateProfileResult = await updateProfileResponse.json();
    console.log('✅ PUT Profile Update Response:', updateProfileResult);
    
    // Test Password Change
    console.log('\n🔑 Testing Password Change...');
    const passwordChangeResponse = await fetch(`${API_BASE_URL}/api/profile/password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: 'admin123',
        newPassword: 'admin123' // Keep same password for testing
      })
    });
    
    const passwordChangeResult = await passwordChangeResponse.json();
    console.log('✅ Password Change Response:', passwordChangeResult);
    
    // Get updated profile to verify changes
    console.log('\n🔍 Verifying Profile Changes...');
    const verifyProfileResponse = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const verifyProfileResult = await verifyProfileResponse.json();
    console.log('✅ Verified Profile Response:', verifyProfileResult);
    
    console.log('\n🎉 All Profile API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Profile API Test Error:', error);
  }
}

// Run the test
testProfileAPI();
