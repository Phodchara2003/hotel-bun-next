// Simple test to check user management API
const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Testing user management API...');
    
    // Test direct API call to admin users endpoint
    const response = await axios.get('http://localhost:3001/admin/users', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY5MTg1NDIsImV4cCI6MTc1NzUyMzM0Mn0.aKrwNnHjyU-7eTzZtpPD5IUWFbaPIfMTvbOAqr2Shbw'
      }
    });
    
    console.log('✅ API Response:', {
      status: response.status,
      totalUsers: response.data.users.length,
      pagination: response.data.pagination
    });
    
    console.log('\n👥 Users in system:');
    response.data.users.forEach(user => {
      console.log(`- ${user.email} (${user.first_name} ${user.last_name}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();
