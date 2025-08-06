import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3001';

// Test data
const adminCredentials = {
  email: 'admin@hotel.com',
  password: 'admin123'
};

let authToken = '';

async function testAPI(endpoint, method = 'GET', data = null, headers = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data && !(data instanceof FormData)) {
    options.body = JSON.stringify(data);
  } else if (data instanceof FormData) {
    delete options.headers['Content-Type']; // Let fetch set it for FormData
    options.body = data;
  }
  
  try {
    const response = await fetch(url, options);
    const result = await response.text();
    
    console.log(`\n📋 ${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    
    try {
      const json = JSON.parse(result);
      console.log('Response:', JSON.stringify(json, null, 2));
      return json;
    } catch {
      console.log('Response:', result);
      return result;
    }
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return null;
  }
}

async function login() {
  console.log('🔐 Testing admin login...');
  const result = await testAPI('/api/auth/login', 'POST', adminCredentials);
  
  if (result && result.token) {
    authToken = result.token;
    console.log('✅ Login successful!');
    return true;
  } else {
    console.log('❌ Login failed!');
    return false;
  }
}

async function testPaymentSettings() {
  console.log('\n🏦 Testing Payment Settings API...');
  
  const authHeaders = { 'Authorization': `Bearer ${authToken}` };
  
  // Test GET payment settings
  console.log('\n1. Get payment settings:');
  await testAPI('/api/payment-settings', 'GET', null, authHeaders);
  
  // Test PUT payment settings
  console.log('\n2. Update payment settings:');
  const updateData = {
    bankName: 'ธนาคารกสิกรไทย',
    accountNumber: '123-4-56789-0',
    accountName: 'Royal Garden Hotel'
  };
  await testAPI('/api/payment-settings', 'PUT', updateData, authHeaders);
  
  // Test file upload (simulate QR code upload)
  console.log('\n3. Test QR code upload (simulation):');
  
  // Create a test image buffer
  const testImageContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const testImageBuffer = Buffer.from(testImageContent, 'base64');
  
  const formData = new FormData();
  const blob = new Blob([testImageBuffer], { type: 'image/png' });
  formData.append('qrCode', blob, 'test-qr.png');
  
  try {
    const response = await fetch(`${BASE_URL}/api/payment-settings/qr-code`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ QR code upload test failed:', error.message);
  }
  
  // Test GET after updates
  console.log('\n4. Get updated payment settings:');
  await testAPI('/api/payment-settings', 'GET', null, authHeaders);
}

async function testStaticFileServing() {
  console.log('\n🖼️ Testing static file serving...');
  
  // Test a non-existent file
  console.log('\n1. Test non-existent file:');
  await testAPI('/uploads/non-existent.jpg');
  
  // Note: We can't easily test actual file serving without uploading a real file first
  console.log('\n2. Static file serving will be tested after QR code upload in the frontend');
}

async function runAllTests() {
  console.log('🧪 Starting Payment Settings API Tests...\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without admin authentication');
    return;
  }
  
  // Test payment settings API
  await testPaymentSettings();
  
  // Test static file serving
  await testStaticFileServing();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Open http://localhost:3003 in browser');
  console.log('2. Login as admin (admin@hotel.com / admin123)');
  console.log('3. Navigate to "ตั้งค่าการชำระเงิน" in the menu');
  console.log('4. Upload a QR code image');
  console.log('5. Update bank details');
  console.log('6. Test the payment flow with customers');
}

// Run tests
runAllTests().catch(console.error);
