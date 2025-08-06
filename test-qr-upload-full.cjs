const http = require('http');
const fs = require('fs');
const path = require('path');

// Create test form data
const boundary = '----WebKitFormBoundaryExample';
const filename = 'test-qr.png';
const filepath = path.join(__dirname, 'backend', 'uploads', 'qr', filename);

// Read the test QR image
let fileBuffer;
try {
  fileBuffer = fs.readFileSync(filepath);
  console.log(`✅ Found test file: ${filepath} (${fileBuffer.length} bytes)`);
} catch (error) {
  console.error(`❌ Could not read test file: ${filepath}`);
  process.exit(1);
}

// Create multipart form data
const formData = [
  `--${boundary}`,
  `Content-Disposition: form-data; name="qrCode"; filename="${filename}"`,
  `Content-Type: image/png`,
  '',
  fileBuffer.toString('binary'),
  `--${boundary}--`
].join('\r\n');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/payment-settings/qr-code',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(formData, 'binary')
  }
};

console.log('🚀 Testing QR code upload...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
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

req.write(formData, 'binary');
req.end();
