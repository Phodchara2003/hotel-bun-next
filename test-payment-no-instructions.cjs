const http = require('http');

const data = JSON.stringify({
  bankName: 'ธนาคารทดสอบใหม่',
  accountNumber: '999-888-777',
  accountName: 'New Test Account'
  // ไม่มี instructions ดู
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/payment-settings',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('🔧 Testing PUT payment settings without instructions...');
console.log('Data:', data);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.write(data);
req.end();
