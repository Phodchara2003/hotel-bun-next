// Use built-in http module to test check-in history
const http = require('http');

async function testCheckinHistoryAPI() {
  try {
    console.log('🔧 Testing Check-in History API...');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/bookings/checkin-history',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      console.log('📊 Response Status:', res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📊 API Response:', JSON.stringify(result, null, 2));
          
          if (result.success) {
            console.log('✅ Check-in history retrieved successfully!');
            console.log(`📊 Found ${result.data.length} records`);
            
            result.data.forEach((booking, index) => {
              console.log(`\n📋 Record ${index + 1}:`);
              console.log(`  - Booking ID: ${booking.id} (${booking.booking_reference})`);
              console.log(`  - Guest: ${booking.guest_name}`);
              console.log(`  - Status: ${booking.status}`);
              console.log(`  - Check-in: ${new Date(booking.actual_check_in_time).toLocaleString()}`);
              if (booking.actual_check_out_time) {
                console.log(`  - Check-out: ${new Date(booking.actual_check_out_time).toLocaleString()}`);
              }
              if (booking.stay_duration_hours !== null) {
                console.log(`  - Duration: ${booking.stay_duration_hours} hours`);
              }
            });
          } else {
            console.log('❌ Failed to retrieve history:', result.message);
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
    
    req.end();
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testCheckinHistoryAPI();