// API Testing Script - ตรวจสอบ API ทั้งหมด
console.log('🧪 API Testing Script - เริ่มทดสอบ API ทั้งหมด\n');

const API_BASE = 'http://localhost:3002/api';

// Test API endpoint
const testAPI = async (method, endpoint, data = null, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const responseData = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }
    
    return {
      status: response.status,
      success: response.ok,
      data: parsedData
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
};

// Main testing function
const runAPITests = async () => {
  console.log('📡 Testing Backend Connection...');
  
  // 1. Test Basic Backend Health
  console.log('\n1️⃣ Backend Health Check');
  const healthCheck = await testAPI('GET', '/health');
  console.log('   Health Check:', healthCheck.success ? '✅ Success' : '❌ Failed', `(${healthCheck.status})`);
  
  // 2. Test Authentication
  console.log('\n2️⃣ Authentication System');
  
  // Test Login
  const loginData = {
    email: 'admin@hotel.com',
    password: 'admin123'
  };
  
  const loginResult = await testAPI('POST', '/auth/login', loginData);
  console.log('   Login API:', loginResult.success ? '✅ Success' : '❌ Failed', `(${loginResult.status})`);
  
  if (loginResult.success && loginResult.data.token) {
    console.log('   Token received: ✅ Yes');
    const token = loginResult.data.token;
    
    // Test Token Validation
    const tokenValidation = await testAPI('GET', '/auth/me', null, token);
    console.log('   Token Validation:', tokenValidation.success ? '✅ Success' : '❌ Failed', `(${tokenValidation.status})`);
    
    // 3. Test Admin Users API
    console.log('\n3️⃣ Admin Users API');
    
    const usersResult = await testAPI('GET', '/admin/users', null, token);
    console.log('   Get Users:', usersResult.success ? '✅ Success' : '❌ Failed', `(${usersResult.status})`);
    
    if (usersResult.success && usersResult.data.users) {
      console.log(`   Users Count: ${usersResult.data.users.length} users found`);
      console.log(`   Sample User: ${usersResult.data.users[0]?.first_name || 'N/A'} ${usersResult.data.users[0]?.last_name || 'N/A'}`);
    }
    
    // Test Create User
    const newUser = {
      username: 'test_user_' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'test123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    };
    
    const createResult = await testAPI('POST', '/admin/users', newUser, token);
    console.log('   Create User:', createResult.success ? '✅ Success' : '❌ Failed', `(${createResult.status})`);
    
    if (!createResult.success) {
      console.log('   Create User Error:', createResult.data || createResult.error);
    }
    
    if (createResult.success && createResult.data.user) {
      const createdUserId = createResult.data.user.id;
      console.log(`   Created User ID: ${createdUserId}`);
      
      // Test Update User
      const updateData = { 
        email: newUser.email,
        firstName: 'Updated Test',
        lastName: 'Updated User',
        phone: '123-456-7890',
        role: 'user'
      };
      const updateResult = await testAPI('PUT', `/admin/users/${createdUserId}`, updateData, token);
      console.log('   Update User:', updateResult.success ? '✅ Success' : '❌ Failed', `(${updateResult.status})`);
      
      if (!updateResult.success) {
        console.log('   Update User Error:', updateResult.data || updateResult.error);
      };
      
      // Test Delete User
      const deleteResult = await testAPI('DELETE', `/admin/users/${createdUserId}`, null, token);
      console.log('   Delete User:', deleteResult.success ? '✅ Success' : '❌ Failed', `(${deleteResult.status})`);
    }
    
    // 4. Test Hotels API
    console.log('\n4️⃣ Hotels API');
    
    const hotelsResult = await testAPI('GET', '/hotels');
    console.log('   Get Hotels:', hotelsResult.success ? '✅ Success' : '❌ Failed', `(${hotelsResult.status})`);
    
    // 5. Test Rooms API
    console.log('\n5️⃣ Rooms API');
    
    const roomsResult = await testAPI('GET', '/rooms', null, token);
    console.log('   Get Rooms:', roomsResult.success ? '✅ Success' : '❌ Failed', `(${roomsResult.status})`);
    
    // 6. Test Bookings API
    console.log('\n6️⃣ Bookings API');
    
    const bookingsResult = await testAPI('GET', '/admin/bookings', null, token);
    console.log('   Get Bookings:', bookingsResult.success ? '✅ Success' : '❌ Failed', `(${bookingsResult.status})`);
    
    // 7. Test Reviews API
    console.log('\n7️⃣ Reviews API');
    
    const reviewsResult = await testAPI('GET', '/reviews/hotel/1');
    console.log('   Get Reviews:', reviewsResult.success ? '✅ Success' : '❌ Failed', `(${reviewsResult.status})`);
    
    // 8. Test Payments API
    console.log('\n8️⃣ Payments API');
    
    const paymentsResult = await testAPI('GET', '/admin/payments', null, token);
    console.log('   Get Payments:', paymentsResult.success ? '✅ Success' : '❌ Failed', `(${paymentsResult.status})`);
    
  } else {
    console.log('   Token received: ❌ No - Cannot test protected endpoints');
  }
  
  // Summary
  console.log('\n📊 API Test Summary');
  console.log('=====================================');
  console.log('Backend URL:', API_BASE);
  console.log('Test completed at:', new Date().toLocaleString('th-TH'));
  console.log('=====================================');
};

// Error handling wrapper
const main = async () => {
  try {
    await runAPITests();
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
};

// Run tests
main();
