const crypto = require('crypto');

// This is the same secret used in the backend
const JWT_SECRET = 'hotel_booking_jwt_secret_2025_very_secure_key_12345';

// Create a simple JWT token manually (for testing purposes)
function createTestToken() {
  const header = {
    "alg": "HS256",
    "typ": "JWT"
  };
  
  const payload = {
    "id": 1,
    "email": "admin@hotel.com", 
    "role": "admin",
    "iat": Math.floor(Date.now() / 1000),
    "exp": Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

const testWithValidToken = async () => {
  console.log('🧪 Testing with manually created valid token...');
  
  try {
    const token = createTestToken();
    console.log('Generated token:', token);
    
    console.log('Testing notifications endpoint...');
    const response = await fetch('http://localhost:3003/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.status === 200) {
      console.log('✅ Notifications API working!');
    } else {
      console.log('❌ Notifications API failed');
    }
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
};

testWithValidToken();