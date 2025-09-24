// Test script to verify manager role functionality

const API_BASE = 'http://localhost:3001';

async function testManagerAccess() {
  try {
    console.log('🧪 Testing Manager Role Access...\n');
    
    // 1. Login as manager
    console.log('1️⃣ Logging in as manager...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'manager@example.com',
        password: '123456'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      throw new Error('Login failed');
    }
    
    const token = loginData.data.token;
    const user = loginData.data.user;
    
    console.log('✅ Login successful');
    console.log(`   User: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Token: ${token.substring(0, 20)}...\n`);
    
    // 2. Test users API access
    console.log('2️⃣ Testing users API access...');
    const usersResponse = await fetch(`${API_BASE}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const usersData = await usersResponse.json();
    
    console.log('✅ Users API accessible');
    console.log(`   Total users: ${usersData.users.length}`);
    console.log(`   Pagination: ${usersData.pagination.total} total\n`);
    
    // 3. Test specific user details
    console.log('3️⃣ Testing user details API...');
    const userDetailResponse = await fetch(`${API_BASE}/api/admin/users/${user.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const userDetailData = await userDetailResponse.json();
    
    console.log('✅ User details API accessible');
    console.log(`   User details: ${userDetailData.data.email} (${userDetailData.data.role})\n`);
    
    console.log('🎉 Manager role test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testManagerAccess();