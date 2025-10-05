const http = require('http');

const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1OTU3Njg3OSwiZXhwIjoxNzU5NjYzMjc5fQ.-0UxguR7Qk9AJBo3Y5jcHaZGplxNPeloY';

// ทดสอบ PUT และ DELETE APIs
const updateDeleteEndpoints = [
  // Update Room
  {
    method: 'PUT',
    path: '/api/admin/rooms/24',
    name: 'Update Room Type',
    requiresAuth: true,
    data: {
      name: 'Updated Test Room',
      description: 'Updated Description',
      price_per_night: 600,
      max_guests: 3,
      bed_type: 'double'
    }
  },
  
  // Toggle Room Availability
  {
    method: 'PATCH',
    path: '/api/admin/rooms/24/toggle-availability',
    name: 'Toggle Room Availability',
    requiresAuth: true,
    data: {}
  },
  
  // Individual Room Status Update
  {
    method: 'PUT',
    path: '/api/rooms/71/status',
    name: 'Update Individual Room Status',
    requiresAuth: true,
    data: {
      status: 'maintenance'
    }
  },
  
  // Create Booking (Test POST)
  {
    method: 'POST',
    path: '/api/bookings',
    name: 'Create Booking',
    data: {
      hotel_id: 2,
      room_type_id: 8,
      user_id: 1,
      bed_type: 'single',
      check_in_date: '2025-10-15',
      check_out_date: '2025-10-17',
      guests: 1,
      total_price: 1200,
      guest_name: 'Test Guest',
      guest_phone: '0812345678',
      guest_email: 'test@example.com'
    }
  }
];

async function testEndpoint(endpoint) {
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

async function testUpdateDeleteEndpoints() {
  console.log('🧪 Testing UPDATE/DELETE API Endpoints...\n');
  
  const results = [];
  
  for (const endpoint of updateDeleteEndpoints) {
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
      if (result.response.message) {
        console.log(`   Message: ${result.response.message}`);
      }
    }
    console.log('');
    
    // รอเล็กน้อยระหว่าง requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // สรุปผล
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('📊 UPDATE/DELETE Summary:');
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n🚨 Failed Endpoints:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   ${r.method} ${r.path} - Status: ${r.status}`);
      if (r.response && typeof r.response === 'object' && r.response.message) {
        console.log(`      Message: ${r.response.message}`);
      }
    });
  }
}

testUpdateDeleteEndpoints().catch(console.error);