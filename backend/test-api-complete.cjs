const http = require('http');

// ทดสอบ API การค้นหาห้องพัก
async function testRoomSearchAPI() {
  console.log('🔍 Testing Room Search API...\n');

  const testData = {
    checkin: '2025-01-15',
    checkout: '2025-01-16', 
    guests: 1,
    bedType: '' // ทุกประเภท
  };

  console.log('📋 Test Parameters:', testData);

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/rooms/search?checkin=${testData.checkin}&checkout=${testData.checkout}&guests=${testData.guests}&bedType=${testData.bedType}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ API Response Status:', res.statusCode);
          console.log('📥 Response Data:');
          console.log(JSON.stringify(response, null, 2));

          if (response.success && response.data) {
            console.log(`\n🏨 Found ${response.data.length} available room types:`);
            response.data.forEach((room, index) => {
              console.log(`${index + 1}. ${room.room_type_name} (${room.bed_type}) - ฿${room.price_per_night} - ${room.available_count} ห้องว่าง`);
            });
          }

          resolve(response);
        } catch (error) {
          console.error('❌ JSON Parse Error:', error.message);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

// ทดสอบการกรองตามประเภทเตียง
async function testBedTypeFilter() {
  console.log('\n🛏️ Testing Bed Type Filter...\n');

  const testCases = [
    { bedType: 'single', name: 'เตียงเดี่ยว' },
    { bedType: 'double', name: 'เตียงคู่' },
    { bedType: '', name: 'ทุกประเภท' }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- Testing ${testCase.name} (${testCase.bedType || 'all'}) ---`);

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/rooms/search?checkin=2025-01-15&checkout=2025-01-16&guests=1&bedType=${testCase.bedType}`,
      method: 'GET'
    };

    try {
      const response = await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(error);
            }
          });
        });
        req.on('error', reject);
        req.end();
      });

      if (response.success && response.data) {
        console.log(`✅ Found ${response.data.length} room types for ${testCase.name}`);
        response.data.forEach(room => {
          console.log(`   - ${room.room_type_name} (${room.bed_type}) - ${room.available_count} ห้องว่าง`);
        });
      } else {
        console.log(`❌ No rooms found for ${testCase.name}`);
      }
    } catch (error) {
      console.error(`❌ Error testing ${testCase.name}:`, error.message);
    }
  }
}

// รันการทดสอบ
async function runTests() {
  console.log('🚀 Starting API Tests...\n');

  try {
    // ทดสอบ Basic API
    await testRoomSearchAPI();

    // ทดสอบการกรองตามประเภทเตียง
    await testBedTypeFilter();

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();