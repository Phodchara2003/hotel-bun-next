const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1OTU3Njg3OSwiZXhwIjoxNzU5NjYzMjc5fQ.-0UxguR7Qk9AJBo3Y5jcHaZGplxNPeloY';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin/rooms',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ API Response Status:', res.statusCode);
      console.log('✅ Success:', response.success);
      console.log('✅ Room Count:', response.data.length);
      
      response.data.forEach((room, i) => {
        console.log(`📍 Room ${i+1}: ${room.name}`);
        console.log(`   - Sub-rooms: ${room.sub_rooms?.length || 0}`);
        console.log(`   - Total: ${room.total_rooms}, Available: ${room.available_rooms}`);
      });
    } catch (error) {
      console.error('❌ JSON Parse Error:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error);
});

req.end();