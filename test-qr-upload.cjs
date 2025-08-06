const http = require('http');

// Test simple POST to QR endpoint
const postData = JSON.stringify({ test: true });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/payment-settings/qr-code',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.write(postData);
req.end();
