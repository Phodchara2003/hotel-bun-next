const http = require('http');

// Admin token สำหรับการทดสอบ
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1OTU3Njg3OSwiZXhwIjoxNzU5NjYzMjc5fQ.-0UxguR7Qk9AJBo3Y5jcHaZGplxNPeloY';

// รายชื่อ API endpoints ที่ต้องทดสอบ
const endpoints = [
  // Public APIs
  { method: 'GET', path: '/api/test', name: 'API Test' },
  { method: 'GET', path: '/api/hotels', name: 'Get Hotels' },
  { method: 'GET', path: '/api/room-types', name: 'Get Room Types' },
  { method: 'GET', path: '/api/rooms', name: 'Get Rooms' },
  { method: 'GET', path: '/api/room-types-with-images', name: 'Room Types with Images' },
  
  // Admin APIs
  { method: 'GET', path: '/api/admin/rooms', name: 'Admin - Get All Rooms', requiresAuth: true },
  { method: 'GET', path: '/api/admin/bookings/detailed', name: 'Admin - Detailed Bookings', requiresAuth: true },
  { method: 'GET', path: '/api/admin/dashboard/stats', name: 'Admin - Dashboard Stats', requiresAuth: true },
  { method: 'GET', path: '/api/admin/users', name: 'Admin - Get Users', requiresAuth: true },
  { method: 'GET', path: '/api/admin/payment-settings', name: 'Admin - Payment Settings', requiresAuth: true },
  
  // Booking APIs
  { method: 'GET', path: '/api/bookings', name: 'Get Bookings' },
  
  // Notification APIs
  { method: 'GET', path: '/api/notifications', name: 'Get Notifications' },
  { method: 'GET', path: '/api/notifications/unread-count', name: 'Unread Notifications Count' },
  
  // Global Settings
  { method: 'GET', path: '/api/global-settings', name: 'Global Settings' },
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // เพิ่ม Authorization header ถ้าจำเป็น
    if (endpoint.requiresAuth) {
      options.headers['Authorization'] = `Bearer ${adminToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let result = {
          name: endpoint.name,
          method: endpoint.method,
          path: endpoint.path,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          response: null,
          error: null
        };

        try {
          result.response = JSON.parse(data);
        } catch (error) {
          result.response = data;
        }

        resolve(result);
      });
    });

    req.on('error', (error) => {
      resolve({
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        status: 0,
        success: false,
        response: null,
        error: error.message
      });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🧪 Testing API Endpoints...\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.method} ${result.path} - ${result.name}`);
    console.log(`   Status: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else if (result.response && typeof result.response === 'object') {
      if (result.response.success !== undefined) {
        console.log(`   Success: ${result.response.success}`);
      }
      if (result.response.data && Array.isArray(result.response.data)) {
        console.log(`   Data Count: ${result.response.data.length}`);
      }
    }
    console.log('');
  }
  
  // สรุปผล
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('📊 Summary:');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
  
  // แสดงรายการที่ล้มเหลว
  if (failed > 0) {
    console.log('\n🚨 Failed Endpoints:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.method} ${r.path} - Status: ${r.status}, Error: ${r.error || 'Unknown'}`);
    });
  }
}

testAllEndpoints().catch(console.error);