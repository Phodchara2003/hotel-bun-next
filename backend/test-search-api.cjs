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
  path: '/api/rooms/search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('API Response Structure:');
      console.log('- success:', parsed.success);
      console.log('- count:', parsed.count);
      console.log('- data type:', Array.isArray(parsed.data) ? 'Array' : typeof parsed.data);
      console.log('- data length:', parsed.data ? parsed.data.length : 'undefined');
      console.log('- searchParams:', parsed.searchParams);
      console.log('- debug keys:', Object.keys(parsed.debug || {}));
      
      if (parsed.data && parsed.data.length > 0) {
        console.log('\nFirst room sample:');
        console.log('- id:', parsed.data[0].id);
        console.log('- name:', parsed.data[0].name);
        console.log('- available_rooms:', parsed.data[0].available_rooms);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

console.log('Testing room search API...');
console.log('Search params:', testData);
req.write(postData);
req.end();