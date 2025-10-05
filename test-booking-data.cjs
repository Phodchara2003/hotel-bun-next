const axios = require('axios');

async function testBookingData() {
  try {
    const response = await axios.get('http://localhost:3001/api/bookings', {
      headers: { 'Authorization': 'Bearer test-token' }
    });
    
    const data = response.data;
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('=== ข้อมูลการจองรายการแรก ===');
      console.log(JSON.stringify(data.data[0], null, 2));
      
      console.log('\n=== การตรวจสอบ field วันที่ ===');
      const booking = data.data[0];
      console.log('check_in_date:', booking.check_in_date, typeof booking.check_in_date);
      console.log('check_out_date:', booking.check_out_date, typeof booking.check_out_date);
      
      // ตรวจสอบ field อื่นๆ ที่อาจเป็นวันที่
      Object.keys(booking).forEach(key => {
        if (key.includes('date') || key.includes('Date')) {
          console.log(`${key}:`, booking[key], typeof booking[key]);
        }
      });
    } else {
      console.log('ไม่พบข้อมูลการจอง');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testBookingData();