const axios = require('axios');

async function testRoomTypesAPI() {
  try {
    console.log('🏠 Testing room-types API for user view...');
    
    const response = await axios.get('http://localhost:3001/api/room-types-with-images');
    console.log('✅ User room-types response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API Error:', error.response?.data || error.message);
  }
}

testRoomTypesAPI();