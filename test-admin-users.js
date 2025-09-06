// Test admin users API with actual token using built-in fetch
async function testAdminUsersAPI() {
  try {
    // Token จาก log ที่เห็นใน backend
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY4NzUwNTgsImV4cCI6MTc1NzQ3OTg1OH0.CEQUI622l5njFYBMpzKAprIjbpeAGD4iZ_yT7IQHq8Y';
    
    console.log('🚀 Testing Admin Users API...');
    console.log('🔗 URL: http://localhost:3001/api/admin/users');
    console.log('🔑 Token: ' + token.substring(0, 50) + '...');
    
    const url = new URL('http://localhost:3001/api/admin/users');
    url.searchParams.set('page', '1');
    url.searchParams.set('limit', '20');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📝 Response Status Text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response Error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log('📊 Response Data:');
    console.log('- Users count:', data.users?.length || 0);
    console.log('- Pagination:', data.pagination);
    
    if (data.users && data.users.length > 0) {
      console.log('👥 Users:');
      data.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.fullName || user.firstName + ' ' + user.lastName} (${user.email}) - ${user.role}`);
      });
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    
    if (error.response) {
      console.error('📥 Response Status:', error.response.status);
      console.error('📥 Response Data:', error.response.data);
    } else if (error.request) {
      console.error('📤 No response received:', error.request);
    }
    
    throw error;
  }
}

// เรียกใช้ function
testAdminUsersAPI()
  .then(() => {
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });
