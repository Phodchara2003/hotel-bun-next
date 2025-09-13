import jwt from 'jsonwebtoken';

const generateTestToken = () => {
  const secret = 'hotel_booking_jwt_secret_2025_very_secure_key_12345';
  const payload = {
    id: 2,
    email: 'admin@hotel.com',
    role: 'admin'
  };
  
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  console.log('Generated token:', token);
  return token;
};

const testNotifications = async () => {
  console.log('🧪 Testing Notifications with fresh token...');
  
  try {
    const token = generateTestToken();
    
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

testNotifications();