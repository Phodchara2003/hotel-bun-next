// Test API response structure in detail
async function testAPIResponse() {
  try {
    const response = await fetch('http://localhost:3001/api/rooms/search?checkin=2025-10-05&checkout=2025-10-07&guests=2');
    const data = await response.json();
    
    console.log('🔍 Full API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data && data.data.length > 0) {
      console.log('\n🏨 First Room Raw Data:');
      console.log('Keys:', Object.keys(data.data[0]));
      console.log('available_count value:', data.data[0].available_count);
      console.log('available_count type:', typeof data.data[0].available_count);
      
      // ตรวจสอบทุกคีย์ที่มี "available" หรือ "count"
      Object.keys(data.data[0]).forEach(key => {
        if (key.includes('available') || key.includes('count')) {
          console.log(`Found key "${key}":`, data.data[0][key]);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPIResponse();