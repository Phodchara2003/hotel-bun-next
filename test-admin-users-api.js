// Test Admin Users API

async function testAdminUsersAPI() {
  try {
    console.log('🔍 Testing Admin Users API...');
    
    // Test without authentication first
    console.log('\n1. Testing GET /api/admin/users without auth:');
    const response1 = await fetch('http://localhost:3001/api/admin/users');
    console.log('Status:', response1.status);
    const result1 = await response1.json();
    console.log('Response:', result1);
    
    // You would need a valid admin token for this to work
    console.log('\n2. API Endpoint is available at: http://localhost:3001/api/admin/users');
    console.log('3. Frontend page is available at: /admin/users');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAdminUsersAPI();
