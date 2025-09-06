// Test admin route directly with correct path
console.log('🚀 Testing admin route with exact URL...');

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY4NzUwNTgsImV4cCI6MTc1NzQ3OTg1OH0.CEQUI622l5njFYBMpzKAprIjbpeAGD4iZ_yT7IQHq8Y';

async function testAdminRoute() {
  try {
    console.log('📤 Making request to: http://localhost:3001/api/admin/users');
    
    const response = await fetch('http://localhost:3001/api/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('📥 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📄 Response text:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('✅ Parsed data:', data);
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError.message);
    }

  } catch (error) {
    console.log('❌ Error:', error);
    console.log('❌ Error code:', error.code);
    console.log('❌ Error cause:', error.cause);
  }
}

testAdminRoute();
