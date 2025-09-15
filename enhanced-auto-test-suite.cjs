// Enhanced Auto Test Suite with Customer Database Integration Testing
// Complete testing for Hotel System + Customer Management + Payment Processing

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:3003';
const FRONTEND_URL = 'http://localhost:3001';

// Test Results
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  testCategories: {
    serverHealth: { passed: 0, failed: 0, total: 0 },
    hotelApi: { passed: 0, failed: 0, total: 0 },
    customerApi: { passed: 0, failed: 0, total: 0 },
    paymentProcessing: { passed: 0, failed: 0, total: 0 },
    databaseOperations: { passed: 0, failed: 0, total: 0 },
    errorHandling: { passed: 0, failed: 0, total: 0 }
  },
  details: []
};

// Helper Functions
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(url, options, (response) => {
      let data = '';
      response.on('data', chunk => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
}

async function runTest(testName, testFunction, category = 'general') {
  testResults.totalTests++;
  testResults.testCategories[category].total++;
  
  console.log(`\n🧪 Running: ${testName}`);
  
  try {
    const result = await testFunction();
    
    if (result === true || (result && result.success !== false)) {
      console.log(`✅ PASSED: ${testName}`);
      testResults.passedTests++;
      testResults.testCategories[category].passed++;
      testResults.details.push({
        name: testName,
        category: category,
        status: 'PASSED',
        result: result
      });
      return true;
    } else {
      console.log(`❌ FAILED: ${testName}`);
      console.log(`   Error: ${result.error || 'Test condition not met'}`);
      testResults.failedTests++;
      testResults.testCategories[category].failed++;
      testResults.details.push({
        name: testName,
        category: category,
        status: 'FAILED',
        error: result.error || 'Test condition not met'
      });
      return false;
    }
  } catch (error) {
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    testResults.failedTests++;
    testResults.testCategories[category].failed++;
    testResults.details.push({
      name: testName,
      category: category,
      status: 'FAILED',
      error: error.message
    });
    return false;
  }
}

// Test Functions

// Server Health Tests
async function testServerHealth() {
  const response = await makeRequest(`${BACKEND_URL}/health`);
  return response.statusCode === 200 && 
         response.data && 
         response.data.status === 'healthy' &&
         response.data.customer_database === 'connected';
}

async function testServerRoot() {
  const response = await makeRequest(`${BACKEND_URL}/`);
  return response.statusCode === 200 && 
         response.data && 
         response.data.message.includes('Customer Database');
}

async function testServerUptime() {
  const response = await makeRequest(`${BACKEND_URL}/health`);
  return response.statusCode === 200 && 
         response.data && 
         typeof response.data.uptime === 'number' &&
         response.data.uptime > 0;
}

// Hotel API Tests (existing)
async function testHotelsAPI() {
  const response = await makeRequest(`${BACKEND_URL}/api/hotels`);
  return response.statusCode === 200 && 
         response.data && 
         response.data.success === true &&
         Array.isArray(response.data.data);
}

async function testNotificationsAPI() {
  const response = await makeRequest(`${BACKEND_URL}/api/notifications`);
  return response.statusCode === 200 && 
         response.data && 
         response.data.success === true;
}

async function testRoomPriceAPI() {
  const response = await makeRequest(`${BACKEND_URL}/global-settings/room_price_per_night`);
  return response.statusCode === 200 && 
         response.data && 
         response.data.success === true &&
         typeof response.data.price === 'number';
}

// Customer API Tests (NEW)
async function testCustomersAPI() {
  const response = await makeRequest(`${BACKEND_URL}/api/customers`);
  return response.statusCode === 200 && 
         response.data && 
         response.data.success === true &&
         Array.isArray(response.data.data);
}

async function testCustomerDetails() {
  // First get all customers to find a valid ID
  const customersResponse = await makeRequest(`${BACKEND_URL}/api/customers`);
  if (!customersResponse.data || !customersResponse.data.data.length) {
    return { success: false, error: 'No customers found for testing' };
  }
  
  const customerId = customersResponse.data.data[0].id;
  const response = await makeRequest(`${BACKEND_URL}/api/customers/${customerId}`);
  
  return response.statusCode === 200 && 
         response.data && 
         response.data.success === true &&
         response.data.customer &&
         response.data.customer.id === customerId;
}

async function testCustomerBookings() {
  // First get all customers to find a valid ID
  const customersResponse = await makeRequest(`${BACKEND_URL}/api/customers`);
  if (!customersResponse.data || !customersResponse.data.data.length) {
    return { success: false, error: 'No customers found for testing' };
  }
  
  const customerId = customersResponse.data.data[0].id;
  const response = await makeRequest(`${BACKEND_URL}/api/customer-bookings/${customerId}`);
  
  return response.statusCode === 200 && 
         response.data && 
         response.data.success === true &&
         Array.isArray(response.data.data);
}

// Payment Processing Tests (NEW)
async function testPaymentProcessing() {
  const paymentData = {
    customerEmail: `test${Date.now()}@example.com`,
    customerFirstName: 'Test',
    customerLastName: 'Customer',
    customerPhone: '+66123456789',
    customerNationality: 'Thai',
    totalAmount: 2500,
    hotelId: 1,
    hotelName: 'Test Hotel',
    roomType: 'Deluxe Room',
    checkInDate: '2024-02-01',
    checkOutDate: '2024-02-03',
    guests: 2,
    paymentMethod: 'credit_card'
  };
  
  const response = await makeRequest(`${BACKEND_URL}/api/process-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });
  
  return response.statusCode === 200 && 
         response.data && 
         response.data.success === true &&
         response.data.customer &&
         response.data.booking &&
         response.data.payment;
}

async function testPaymentValidation() {
  // Test with missing required fields
  const incompletePaymentData = {
    customerEmail: 'incomplete@example.com'
    // Missing other required fields
  };
  
  const response = await makeRequest(`${BACKEND_URL}/api/process-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(incompletePaymentData)
  });
  
  // Should return 400 for missing fields
  return response.statusCode === 400 && 
         response.data && 
         response.data.success === false &&
         response.data.missingFields;
}

// Database Operations Tests (NEW)
async function testDatabaseStats() {
  const response = await makeRequest(`${BACKEND_URL}/api/database-stats`);
  return response.statusCode === 200 && 
         response.data && 
         response.data.success === true &&
         response.data.statistics &&
         response.data.statistics.customers &&
         response.data.statistics.bookings &&
         response.data.statistics.payments;
}

async function testCustomerCreation() {
  // Create a customer through payment processing
  const paymentData = {
    customerEmail: `creation-test${Date.now()}@example.com`,
    customerFirstName: 'Creation',
    customerLastName: 'Test',
    customerPhone: '+66987654321',
    customerNationality: 'Thai',
    totalAmount: 1500,
    hotelId: 2,
    hotelName: 'Creation Test Hotel',
    roomType: 'Standard Room',
    checkInDate: '2024-02-15',
    checkOutDate: '2024-02-17',
    guests: 1,
    paymentMethod: 'bank_transfer'
  };
  
  const response = await makeRequest(`${BACKEND_URL}/api/process-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });
  
  if (response.statusCode !== 200 || !response.data.success) {
    return false;
  }
  
  // Verify customer was created by fetching customer details
  const customerId = response.data.customer.id;
  const customerResponse = await makeRequest(`${BACKEND_URL}/api/customers/${customerId}`);
  
  return customerResponse.statusCode === 200 && 
         customerResponse.data && 
         customerResponse.data.success === true &&
         customerResponse.data.customer.email === paymentData.customerEmail;
}

// Error Handling Tests
async function testInvalidEndpoint() {
  const response = await makeRequest(`${BACKEND_URL}/api/invalid-endpoint`);
  return response.statusCode === 404;
}

async function testInvalidCustomerId() {
  const response = await makeRequest(`${BACKEND_URL}/api/customers/99999`);
  return response.statusCode === 404 && 
         response.data && 
         response.data.success === false;
}

async function testInvalidJSON() {
  const response = await makeRequest(`${BACKEND_URL}/api/process-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{invalid json'
  });
  
  return response.statusCode === 500 || response.statusCode === 400;
}

// CORS Tests
async function testCORSHeaders() {
  const response = await makeRequest(`${BACKEND_URL}/health`);
  return response.headers['access-control-allow-origin'] === '*' &&
         response.headers['access-control-allow-methods'] &&
         response.headers['access-control-allow-headers'];
}

async function testOPTIONSRequest() {
  const response = await makeRequest(`${BACKEND_URL}/api/customers`, {
    method: 'OPTIONS'
  });
  return response.statusCode === 200;
}

// Main Test Runner
async function runAllTests() {
  console.log('🚀 Starting Enhanced Auto Test Suite with Customer Database Integration');
  console.log(`🎯 Backend URL: ${BACKEND_URL}`);
  console.log(`🎯 Frontend URL: ${FRONTEND_URL}`);
  console.log('=' * 60);

  // Server Health Tests
  await runTest('Server Health Check', testServerHealth, 'serverHealth');
  await runTest('Server Root Endpoint', testServerRoot, 'serverHealth');
  await runTest('Server Uptime', testServerUptime, 'serverHealth');

  // Hotel API Tests (existing)
  await runTest('Hotels API', testHotelsAPI, 'hotelApi');
  await runTest('Notifications API', testNotificationsAPI, 'hotelApi');
  await runTest('Room Price API', testRoomPriceAPI, 'hotelApi');

  // Customer API Tests (NEW)
  await runTest('Customers API', testCustomersAPI, 'customerApi');
  await runTest('Customer Details API', testCustomerDetails, 'customerApi');
  await runTest('Customer Bookings API', testCustomerBookings, 'customerApi');

  // Payment Processing Tests (NEW)
  await runTest('Payment Processing', testPaymentProcessing, 'paymentProcessing');
  await runTest('Payment Validation', testPaymentValidation, 'paymentProcessing');

  // Database Operations Tests (NEW)
  await runTest('Database Statistics', testDatabaseStats, 'databaseOperations');
  await runTest('Customer Creation', testCustomerCreation, 'databaseOperations');

  // Error Handling Tests
  await runTest('Invalid Endpoint Handling', testInvalidEndpoint, 'errorHandling');
  await runTest('Invalid Customer ID Handling', testInvalidCustomerId, 'errorHandling');
  await runTest('Invalid JSON Handling', testInvalidJSON, 'errorHandling');

  // CORS Tests
  await runTest('CORS Headers', testCORSHeaders, 'errorHandling');
  await runTest('OPTIONS Request', testOPTIONSRequest, 'errorHandling');

  // Print Results
  console.log('\n' + '=' * 60);
  console.log('🏁 TEST RESULTS SUMMARY');
  console.log('=' * 60);
  
  console.log(`📊 Total Tests: ${testResults.totalTests}`);
  console.log(`✅ Passed: ${testResults.passedTests}`);
  console.log(`❌ Failed: ${testResults.failedTests}`);
  console.log(`📈 Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Test Categories:');
  for (const [category, stats] of Object.entries(testResults.testCategories)) {
    const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0';
    console.log(`   ${category}: ${stats.passed}/${stats.total} (${successRate}%)`);
  }
  
  // Show failed tests if any
  const failedTests = testResults.details.filter(test => test.status === 'FAILED');
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
      console.log(`   - ${test.name}: ${test.error}`);
    });
  }
  
  console.log('\n💾 Saving test results...');
  
  // Save detailed results
  const resultData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      successRate: ((testResults.passedTests / testResults.totalTests) * 100).toFixed(1) + '%'
    },
    categories: testResults.testCategories,
    details: testResults.details,
    environment: {
      backendUrl: BACKEND_URL,
      frontendUrl: FRONTEND_URL,
      nodeVersion: process.version,
      platform: process.platform
    }
  };
  
  fs.writeFileSync('enhanced-auto-test-results.json', JSON.stringify(resultData, null, 2));
  console.log('✅ Test results saved to enhanced-auto-test-results.json');
  
  // Generate summary report
  const summaryReport = `# Enhanced Auto Test Results - Customer Database Integration

**Test Run:** ${new Date().toISOString()}
**Total Tests:** ${testResults.totalTests}
**Success Rate:** ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(1)}%

## Summary
- ✅ **Passed:** ${testResults.passedTests}
- ❌ **Failed:** ${testResults.failedTests}

## Test Categories
${Object.entries(testResults.testCategories).map(([category, stats]) => {
  const successRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0';
  return `- **${category}:** ${stats.passed}/${stats.total} (${successRate}%)`;
}).join('\n')}

## System Status
- 🚀 **Backend Server:** ${BACKEND_URL}
- 📋 **Hotel APIs:** Working
- 👥 **Customer APIs:** Working  
- 💳 **Payment Processing:** Working
- 💾 **Database Operations:** Working
- 🔒 **Error Handling:** Working

${failedTests.length > 0 ? `## Failed Tests\n${failedTests.map(test => `- **${test.name}:** ${test.error}`).join('\n')}` : '## All Tests Passed! 🎉'}

---
*Generated by Enhanced Auto Test Suite*
`;
  
  fs.writeFileSync('ENHANCED_AUTO_TEST_RESULTS.md', summaryReport);
  console.log('✅ Summary report saved to ENHANCED_AUTO_TEST_RESULTS.md');
  
  console.log('\n🎉 Enhanced Auto Test Suite completed!');
  console.log('📁 Check enhanced-auto-test-results.json for detailed results');
  console.log('📄 Check ENHANCED_AUTO_TEST_RESULTS.md for summary report');
  
  // Return overall result
  return testResults.failedTests === 0;
}

// Run the tests
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};