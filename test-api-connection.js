// Test API Connection for Room Search
const testRoomSearchAPI = async () => {
  try {
    console.log('🧪 Testing Room Search API...');
    
    // Test data
    const testParams = {
      checkin: '2025-10-05',
      checkout: '2025-10-06',
      guests: 2
    };
    
    console.log('📤 Sending request with params:', testParams);
    
    const response = await fetch('http://localhost:3001/api/rooms/search?' + new URLSearchParams(testParams));
    const data = await response.json();
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', data);
    
    if (data.success) {
      console.log('✅ API Test Successful!');
      console.log(`✅ Found ${data.count} available room types`);
      
      if (data.data && data.data.length > 0) {
        console.log('🏨 Sample room data:');
        console.log(data.data[0]);
      }
    } else {
      console.log('❌ API Test Failed:', data.message);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ API Test Error:', error);
    return { success: false, error: error.message };
  }
};

// Test database connection
const testDatabaseConnection = async () => {
  try {
    console.log('🧪 Testing Database Connection...');
    
    const response = await fetch('http://localhost:3001/api/rooms');
    const data = await response.json();
    
    console.log('📥 Database test response:', response.status, data.success ? 'SUCCESS' : 'FAILED');
    
    if (data.success) {
      console.log(`✅ Database connected! Found ${data.data?.length || 0} rooms`);
    } else {
      console.log('❌ Database connection failed');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return { success: false, error: error.message };
  }
};

// Run tests
async function runTests() {
  console.log('🚀 Starting API and Database Tests...\n');
  
  await testDatabaseConnection();
  console.log('\n' + '='.repeat(50) + '\n');
  await testRoomSearchAPI();
  
  console.log('\n✨ Tests completed!');
}

// Auto-run tests when this file is executed
if (typeof window !== 'undefined') {
  // Browser environment
  window.testRoomSearchAPI = testRoomSearchAPI;
  window.testDatabaseConnection = testDatabaseConnection;
  window.runTests = runTests;
  
  console.log('🔧 Test functions loaded! Run: runTests()');
} else {
  // Node environment
  runTests();
}

module.exports = {
  testRoomSearchAPI,
  testDatabaseConnection,
  runTests
};