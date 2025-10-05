const http = require('http');

const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1OTU3Njg3OSwiZXhwIjoxNzU5NjYzMjc5fQ.-0UxguR7Qk9AJBo3Y5jcHaZGplxNPeloY';

// ทดสอบ POST/PUT/DELETE APIs
const crudEndpoints = [
  // Authentication
  {
    method: 'POST',
    path: '/api/auth/login',
    name: 'Login',
    data: { email: 'admin@test.com', password: 'admin123' }
  },
  
  // Room Management
  {
    method: 'POST',
    path: '/api/admin/rooms',
    name: 'Create Room Type',
    requiresAuth: true,
    data: {
      hotel_id: 2,
      name: 'Test Room Type',
      description: 'Test Description for API testing',
      price_per_night: 500,
      max_guests: 2,
      bed_type: 'single',
      amenities: ['WiFi', 'AC'],
      type: 'standard',
      size_sqm: 20
    }
  },
  
  // Search Room
  {
    method: 'POST',
    path: '/api/rooms/search',
    name: 'Search Rooms',
    data: {
      checkIn: '2025-10-10',
      checkOut: '2025-10-12',
      guests: 2
    }
  },
  
  // Check Room Availability
  {
    method: 'POST',
    path: '/api/check-room-availability',
    name: 'Check Room Availability',
    data: {
      checkIn: '2025-10-10',
      checkOut: '2025-10-12',
      room_type_id: 8,
      guests: 1
    }
  },
];

async function testCrudEndpoint(endpoint) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(endpoint.data || {});
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

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

    req.write(postData);
    req.end();
  });
}

async function testCrudEndpoints() {
  console.log('🧪 Testing CRUD API Endpoints...\n');
  
  const results = [];
  
  for (const endpoint of crudEndpoints) {
    const result = await testCrudEndpoint(endpoint);
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
      if (result.response.message) {
        console.log(`   Message: ${result.response.message}`);
      }
      if (result.response.token) {
        console.log(`   Token: ${result.response.token.substring(0, 20)}...`);
      }
    }
    console.log('');
    
    // รอเล็กน้อยระหว่าง requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // สรุปผล
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('📊 CRUD Summary:');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n🚨 Failed CRUD Endpoints:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.method} ${r.path} - Status: ${r.status}, Error: ${r.error || 'Unknown'}`);
      if (r.response && typeof r.response === 'object' && r.response.message) {
        console.log(`      Message: ${r.response.message}`);
      }
    });
  }
}

testCrudEndpoints().catch(console.error);