// Use built-in http module instead of fetch
const http = require('http');

async function testCheckInAPI() {
  try {
    console.log('🔧 Testing Check-in API with debug info...');
    
    const postData = JSON.stringify({
      booking_id: 41,
      staff_id: 1,
      notes: 'Test check-in via API'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/bookings/check-in',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      console.log('📊 Response Status:', res.statusCode);
      console.log('📊 Response Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📊 API Response Body:', JSON.stringify(result, null, 2));
          
          if (result.success) {
            console.log('✅ Check-in successful!');
            console.log('📝 Booking data:', result.data);
          } else {
            console.log('❌ Check-in failed:', result.message);
          }
        } catch (parseError) {
          console.error('❌ Error parsing response:', parseError.message);
          console.log('📊 Raw response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.error('❌ Full error:', error);
  }
}

testCheckInAPI();