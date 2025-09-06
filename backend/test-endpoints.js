// Simple test to check the admin users API
console.log('🧪 Testing /api/admin/users endpoint...');

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY4NzUwNTgsImV4cCI6MTc1NzQ3OTg1OH0.CEQUI622l5njFYBMpzKAprIjbpeAGD4iZ_yT7IQHq8Y';

async function testEndpoint(url) {
  console.log(`🔗 Testing: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response ok: ${response.ok}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
  } catch (error) {
    console.error(`❌ Error for ${url}:`, error.message);
  }
  
  console.log(''); // empty line
}

// Test different endpoints
await testEndpoint('http://localhost:3001/');
await testEndpoint('http://localhost:3001/api');
await testEndpoint('http://localhost:3001/api/admin');
await testEndpoint('http://localhost:3001/api/admin/users');
