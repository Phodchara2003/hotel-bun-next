const fs = require('fs');
const path = require('path');

// Create a simple base64 encoded 1x1 PNG pixel as test QR
const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77KgAAAABJRU5ErkJggg==';
const buffer = Buffer.from(base64PNG, 'base64');

const qrPath = path.join(__dirname, 'backend', 'uploads', 'qr', 'test-qr.png');
fs.writeFileSync(qrPath, buffer);

console.log('Test QR code created at:', qrPath);
console.log('File size:', buffer.length, 'bytes');
