const http = require('http');

const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1OTU3Njg3OSwiZXhwIjoxNzU5NjYzMjc5fQ.-0UxguR7Qk9AJBo3Y5jcHaZGgJDo1mdRaGplxNPeloY';

const testData = {
  hotel_id: 2,
  name: 'Test Room Type',
  description: 'Test Description',
  price_per_night: 500,
  max_guests: 2,
  bed_type: 'single',
  amenities: ['WiFi', 'AC'],
  type: 'standard',
  size_sqm: 20
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin/rooms',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse JSON response');
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

console.log('Sending POST request to create room...');
console.log('Data:', JSON.stringify(testData, null, 2));
req.write(postData);
req.end();