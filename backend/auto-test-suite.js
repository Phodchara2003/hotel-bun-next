// Auto Test Suite for Hotel Booking System
// Tests all API endpoints, database operations, and system functionality

const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3003';
const TEST_RESULTS = [];
let TOTAL_TESTS = 0;
let PASSED_TESTS = 0;
let FAILED_TESTS = 0;

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hotel-Booking-Auto-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test result logging
function logTest(testName, status, details = '', expected = '', actual = '') {
  TOTAL_TESTS++;
  const result = {
    test: testName,
    status: status,
    details: details,
    expected: expected,
    actual: actual,
    timestamp: new Date().toISOString()
  };
  
  TEST_RESULTS.push(result);
  
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${testName}: ${status}`);
  if (details) console.log(`   ${details}`);
  if (status === 'PASS') {
    PASSED_TESTS++;
  } else {
    FAILED_TESTS++;
  }
  console.log('');
}

// Test functions
async function testServerConnection() {
  console.log('🔌 Testing Server Connection...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/`);
    
    if (response.statusCode === 200) {
      logTest('Server Connection', 'PASS', 'Server is running and responding');
      return true;
    } else {
      logTest('Server Connection', 'FAIL', `Expected status 200, got ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    logTest('Server Connection', 'FAIL', `Connection error: ${error.message}`);
    return false;
  }
}

async function testHealthCheck() {
  console.log('🏥 Testing Health Check Endpoint...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/health`);
    
    if (response.statusCode === 200 && response.data.status === 'healthy') {
      logTest('Health Check', 'PASS', `Server uptime: ${response.data.uptime}s`);
      
      // Test database status
      if (response.data.database === 'json_database_connected') {
        logTest('Database Status', 'PASS', 'JSON database connected');
      } else {
        logTest('Database Status', 'FAIL', `Database status: ${response.data.database}`);
      }
      
      // Test data counts
      if (response.data.data_counts && response.data.data_counts.hotels > 0) {
        logTest('Database Data Check', 'PASS', `Hotels: ${response.data.data_counts.hotels}, Notifications: ${response.data.data_counts.notifications}`);
      } else {
        logTest('Database Data Check', 'FAIL', 'No data found in database');
      }
      
    } else {
      logTest('Health Check', 'FAIL', `Expected healthy status, got: ${response.data.status}`);
    }
  } catch (error) {
    logTest('Health Check', 'FAIL', `Request error: ${error.message}`);
  }
}

async function testHotelsAPI() {
  console.log('🏨 Testing Hotels API...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/hotels`);
    
    if (response.statusCode === 200 && response.data.success) {
      const hotels = response.data.data;
      
      if (Array.isArray(hotels) && hotels.length > 0) {
        logTest('Hotels API - Data Retrieval', 'PASS', `Retrieved ${hotels.length} hotels`);
        
        // Test hotel data structure
        const firstHotel = hotels[0];
        const requiredFields = ['id', 'name', 'description', 'location', 'amenities', 'rating', 'avg_price'];
        const missingFields = requiredFields.filter(field => !firstHotel.hasOwnProperty(field));
        
        if (missingFields.length === 0) {
          logTest('Hotels API - Data Structure', 'PASS', 'All required fields present');
        } else {
          logTest('Hotels API - Data Structure', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
        }
        
        // Test data source
        if (response.data.source === 'json_database') {
          logTest('Hotels API - Data Source', 'PASS', 'Data from JSON database');
        } else {
          logTest('Hotels API - Data Source', 'FAIL', `Expected json_database, got: ${response.data.source}`);
        }
        
      } else {
        logTest('Hotels API - Data Retrieval', 'FAIL', 'No hotels data returned');
      }
    } else {
      logTest('Hotels API', 'FAIL', `Expected success response, got status: ${response.statusCode}`);
    }
    
    // Test with limit parameter
    const limitResponse = await makeRequest(`${API_BASE_URL}/api/hotels?limit=2`);
    if (limitResponse.statusCode === 200 && limitResponse.data.data.length <= 2) {
      logTest('Hotels API - Limit Parameter', 'PASS', `Limit parameter working correctly`);
    } else {
      logTest('Hotels API - Limit Parameter', 'FAIL', 'Limit parameter not working');
    }
    
  } catch (error) {
    logTest('Hotels API', 'FAIL', `Request error: ${error.message}`);
  }
}

async function testNotificationsAPI() {
  console.log('🔔 Testing Notifications API...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/notifications`);
    
    if (response.statusCode === 200 && response.data.success) {
      const notifications = response.data.data;
      
      if (Array.isArray(notifications) && notifications.length > 0) {
        logTest('Notifications API - Data Retrieval', 'PASS', `Retrieved ${notifications.length} notifications`);
        
        // Test notification data structure
        const firstNotification = notifications[0];
        const requiredFields = ['id', 'title', 'message', 'type', 'read_status', 'created_at'];
        const missingFields = requiredFields.filter(field => !firstNotification.hasOwnProperty(field));
        
        if (missingFields.length === 0) {
          logTest('Notifications API - Data Structure', 'PASS', 'All required fields present');
        } else {
          logTest('Notifications API - Data Structure', 'FAIL', `Missing fields: ${missingFields.join(', ')}`);
        }
        
      } else {
        logTest('Notifications API - Data Retrieval', 'FAIL', 'No notifications data returned');
      }
    } else {
      logTest('Notifications API', 'FAIL', `Expected success response, got status: ${response.statusCode}`);
    }
  } catch (error) {
    logTest('Notifications API', 'FAIL', `Request error: ${error.message}`);
  }
}

async function testSettingsAPI() {
  console.log('⚙️ Testing Settings API...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/global-settings/room_price_per_night`);
    
    if (response.statusCode === 200 && response.data.success) {
      const price = response.data.price;
      const currency = response.data.currency;
      
      if (typeof price === 'number' && price > 0) {
        logTest('Settings API - Price Data', 'PASS', `Room price: ${price} ${currency}`);
      } else {
        logTest('Settings API - Price Data', 'FAIL', `Invalid price data: ${price}`);
      }
      
      if (currency === 'THB') {
        logTest('Settings API - Currency', 'PASS', 'Currency is THB');
      } else {
        logTest('Settings API - Currency', 'FAIL', `Expected THB, got: ${currency}`);
      }
      
    } else {
      logTest('Settings API', 'FAIL', `Expected success response, got status: ${response.statusCode}`);
    }
  } catch (error) {
    logTest('Settings API', 'FAIL', `Request error: ${error.message}`);
  }
}

async function testDatabaseInfo() {
  console.log('🗄️ Testing Database Info API...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/database-info`);
    
    if (response.statusCode === 200 && response.data.success) {
      const dbInfo = response.data;
      
      if (dbInfo.database_type === 'JSON Files') {
        logTest('Database Info - Type', 'PASS', 'Database type is JSON Files');
      } else {
        logTest('Database Info - Type', 'FAIL', `Expected JSON Files, got: ${dbInfo.database_type}`);
      }
      
      if (dbInfo.status === 'connected') {
        logTest('Database Info - Status', 'PASS', 'Database status is connected');
      } else {
        logTest('Database Info - Status', 'FAIL', `Expected connected, got: ${dbInfo.status}`);
      }
      
      // Test table info
      if (dbInfo.tables && dbInfo.tables.hotels && dbInfo.tables.hotels.records > 0) {
        logTest('Database Info - Tables', 'PASS', `Hotels table has ${dbInfo.tables.hotels.records} records`);
      } else {
        logTest('Database Info - Tables', 'FAIL', 'Hotel table data missing or empty');
      }
      
    } else {
      logTest('Database Info API', 'FAIL', `Expected success response, got status: ${response.statusCode}`);
    }
  } catch (error) {
    logTest('Database Info API', 'FAIL', `Request error: ${error.message}`);
  }
}

async function testCORSHeaders() {
  console.log('🌐 Testing CORS Headers...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/api/hotels`);
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];
    
    let allCorsPresent = true;
    for (const header of corsHeaders) {
      if (!response.headers[header]) {
        allCorsPresent = false;
        break;
      }
    }
    
    if (allCorsPresent) {
      logTest('CORS Headers', 'PASS', 'All CORS headers present');
    } else {
      logTest('CORS Headers', 'FAIL', 'Missing CORS headers');
    }
    
    // Test OPTIONS request
    const optionsResponse = await makeRequest(`${API_BASE_URL}/api/hotels`, 'OPTIONS');
    if (optionsResponse.statusCode === 200) {
      logTest('CORS OPTIONS Request', 'PASS', 'OPTIONS request handled correctly');
    } else {
      logTest('CORS OPTIONS Request', 'FAIL', `OPTIONS request failed with status: ${optionsResponse.statusCode}`);
    }
    
  } catch (error) {
    logTest('CORS Headers', 'FAIL', `Request error: ${error.message}`);
  }
}

async function testErrorHandling() {
  console.log('⚠️ Testing Error Handling...');
  try {
    // Test 404 endpoint
    const response404 = await makeRequest(`${API_BASE_URL}/api/nonexistent`);
    
    if (response404.statusCode === 404) {
      logTest('Error Handling - 404', 'PASS', '404 status returned for non-existent endpoint');
    } else {
      logTest('Error Handling - 404', 'FAIL', `Expected 404, got: ${response404.statusCode}`);
    }
    
    // Test error response format
    if (response404.data && response404.data.error) {
      logTest('Error Handling - Response Format', 'PASS', 'Error response has proper format');
    } else {
      logTest('Error Handling - Response Format', 'FAIL', 'Error response missing error field');
    }
    
  } catch (error) {
    logTest('Error Handling', 'FAIL', `Request error: ${error.message}`);
  }
}

async function testDatabaseFiles() {
  console.log('📁 Testing Database Files...');
  
  const dbDir = path.join(__dirname, 'db');
  const files = ['hotels.json', 'notifications.json', 'settings.json'];
  
  // Test if db directory exists
  if (fs.existsSync(dbDir)) {
    logTest('Database Directory', 'PASS', 'Database directory exists');
    
    // Test each file
    for (const file of files) {
      const filePath = path.join(dbDir, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(content);
          logTest(`Database File - ${file}`, 'PASS', `File exists and contains valid JSON`);
        } catch (error) {
          logTest(`Database File - ${file}`, 'FAIL', `File exists but contains invalid JSON: ${error.message}`);
        }
      } else {
        logTest(`Database File - ${file}`, 'FAIL', 'File does not exist');
      }
    }
  } else {
    logTest('Database Directory', 'FAIL', 'Database directory does not exist');
  }
}

// Generate test report
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 AUTO TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  console.log(`📊 Total Tests: ${TOTAL_TESTS}`);
  console.log(`✅ Passed: ${PASSED_TESTS}`);
  console.log(`❌ Failed: ${FAILED_TESTS}`);
  console.log(`📈 Success Rate: ${((PASSED_TESTS / TOTAL_TESTS) * 100).toFixed(1)}%`);
  console.log('');
  
  // Detailed results
  console.log('📋 DETAILED RESULTS:');
  console.log('-'.repeat(50));
  
  TEST_RESULTS.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
    if (result.details) {
      console.log(`   Details: ${result.details}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  
  // Save report to file
  const reportData = {
    summary: {
      total: TOTAL_TESTS,
      passed: PASSED_TESTS,
      failed: FAILED_TESTS,
      successRate: ((PASSED_TESTS / TOTAL_TESTS) * 100).toFixed(1),
      timestamp: new Date().toISOString()
    },
    results: TEST_RESULTS
  };
  
  fs.writeFileSync(path.join(__dirname, 'test-report.json'), JSON.stringify(reportData, null, 2));
  console.log('💾 Test report saved to test-report.json');
  
  // Return overall status
  return FAILED_TESTS === 0;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Hotel Booking System Auto Test Suite');
  console.log('⏰ ' + new Date().toISOString());
  console.log('='.repeat(80));
  console.log('');
  
  const startTime = Date.now();
  
  // Check if server is running first
  const serverRunning = await testServerConnection();
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   cd backend && node json-db-server.js');
    return false;
  }
  
  // Run all tests
  await testHealthCheck();
  await testHotelsAPI();
  await testNotificationsAPI();
  await testSettingsAPI();
  await testDatabaseInfo();
  await testCORSHeaders();
  await testErrorHandling();
  await testDatabaseFiles();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`⏱️ Test execution completed in ${duration} seconds`);
  console.log('');
  
  const allTestsPassed = generateTestReport();
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! System is working perfectly!');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please check the results above.');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  makeRequest,
  logTest
};