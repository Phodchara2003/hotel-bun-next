const axios = require('axios');

async function testSpecificRoomUpdate() {
  try {
    console.log('📋 Getting room 9 details first...');
    const roomResponse = await axios.get('http://localhost:3001/api/admin/rooms/9');
    console.log('🏠 Room 9 data:', JSON.stringify(roomResponse.data, null, 2));
    
    // Try updating room 9 with minimal data (similar to what frontend sends)
    console.log('\n🔄 Attempting to update room 9...');
    const updateData = {
      name: 'Test Update Room 9',
      description: 'Test description',
      price: 300, // or price_per_night
      capacity: 2, // or max_guests
      type: 'standard'
    };
    
    console.log('📤 Update data being sent:', JSON.stringify(updateData, null, 2));
    
    const updateResponse = await axios.put('http://localhost:3001/api/admin/rooms/9', updateData);
    console.log('✅ Update successful:', updateResponse.data);
    
  } catch (error) {
    console.error('❌ Detailed Error Analysis:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Headers:', error.response?.headers);
    console.error('Request Config:', {
      method: error.config?.method,
      url: error.config?.url,
      data: error.config?.data
    });
  }
}

testSpecificRoomUpdate();