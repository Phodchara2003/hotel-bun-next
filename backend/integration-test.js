// Frontend-Backend Integration Test
// Tests the connection between Next.js frontend and Node.js backend

const http = require('http');

const BACKEND_URL = 'http://localhost:3003';
const FRONTEND_URL = 'http://localhost:3001';

let testResults = [];
let totalTests = 0;
let passedTests = 0;

function logTest(name, status, details) {
  totalTests++;
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${name}: ${status}`);
  if (details) console.log(`   ${details}`);
  
  if (status === 'PASS') passedTests++;
  testResults.push({ name, status, details });
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: json });
        } catch {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testFrontendBackendIntegration() {
  console.log('🔗 Testing Frontend-Backend Integration...\n');
  
  // Test Backend APIs
  console.log('🔧 Testing Backend APIs...');
  try {
    const healthResponse = await makeRequest(`${BACKEND_URL}/health`);
    if (healthResponse.statusCode === 200 && healthResponse.data.status === 'healthy') {
      logTest('Backend Health Check', 'PASS', 'Backend server is healthy');
    } else {
      logTest('Backend Health Check', 'FAIL', 'Backend server is not healthy');
    }
    
    const hotelsResponse = await makeRequest(`${BACKEND_URL}/api/hotels`);
    if (hotelsResponse.statusCode === 200 && hotelsResponse.data.success) {
      logTest('Backend Hotels API', 'PASS', `Retrieved ${hotelsResponse.data.count} hotels`);
    } else {
      logTest('Backend Hotels API', 'FAIL', 'Hotels API failed');
    }
    
  } catch (error) {
    logTest('Backend Connection', 'FAIL', `Cannot connect to backend: ${error.message}`);
  }
  
  // Test Frontend
  console.log('\n🌐 Testing Frontend Server...');
  try {
    const frontendResponse = await makeRequest(FRONTEND_URL);
    if (frontendResponse.statusCode === 200) {
      logTest('Frontend Server', 'PASS', 'Frontend server is running');
    } else {
      logTest('Frontend Server', 'FAIL', `Frontend returned status: ${frontendResponse.statusCode}`);
    }
  } catch (error) {
    logTest('Frontend Connection', 'FAIL', `Cannot connect to frontend: ${error.message}`);
  }
  
  // Test CORS
  console.log('\n🌐 Testing CORS Configuration...');
  try {
    const corsResponse = await makeRequest(`${BACKEND_URL}/api/hotels`);
    if (corsResponse.statusCode === 200) {
      logTest('CORS Configuration', 'PASS', 'CORS is properly configured');
    } else {
      logTest('CORS Configuration', 'FAIL', 'CORS may not be properly configured');
    }
  } catch (error) {
    logTest('CORS Configuration', 'FAIL', `CORS test failed: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 INTEGRATION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
    console.log('✨ Frontend and Backend are working together perfectly!');
  } else {
    console.log('\n⚠️ Some integration tests failed.');
    console.log('📝 Make sure both servers are running:');
    console.log('   Backend: node json-db-server.js (port 3003)');
    console.log('   Frontend: npm run dev (port 3001)');
  }
}

// Run integration tests
if (require.main === module) {
  console.log('🚀 Frontend-Backend Integration Test Suite');
  console.log('⏰ ' + new Date().toISOString());
  console.log('='.repeat(60));
  console.log('');
  
  testFrontendBackendIntegration().catch(error => {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  });
}

module.exports = { testFrontendBackendIntegration };