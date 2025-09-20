const axios = require('axios');

async function testRoomUpdateAPI() {
  try {
    // First get room details
    console.log('📋 Getting room 4 details...');
    const roomResponse = await axios.get('http://localhost:3001/api/admin/rooms/4');
    console.log('🏠 Room data:', roomResponse.data);
    
    // Try to update the room with the same data (minimal change)
    console.log('\n🔄 Updating room 4...');
    const updateData = {
      name: 'Updated Test Room',
      description: 'Updated description',
      price: 1500,
      capacity: 2,
      type: 'deluxe'
    };
    
    console.log('📤 Sending update data:', updateData);
    
    const updateResponse = await axios.put('http://localhost:3001/api/admin/rooms/4', updateData);
    console.log('✅ Update response:', updateResponse.data);
    
  } catch (error) {
    console.error('❌ API Test Error:', error.response?.data || error.message);
    console.error('❌ Status:', error.response?.status);
  }
}

testRoomUpdateAPI();