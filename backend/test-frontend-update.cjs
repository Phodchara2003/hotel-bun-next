const axios = require('axios');

async function testFrontendStyleUpdate() {
  try {
    console.log('🌐 Testing frontend-style room update for room 9...');
    
    // First get room 9 to see current state
    const roomResponse = await axios.get('http://localhost:3001/api/admin/rooms/9');
    console.log('📋 Current room data:', JSON.stringify(roomResponse.data.data, null, 2));
    
    // Simulate what frontend might send (common problematic fields)
    const frontendData = {
      name: 'Test Room Update',
      type: 'standard',
      number: '123', // room number
      description: 'Test description',
      price: '500', // string instead of number
      capacity: '2', // string instead of number
      size: '30', // string
      floor: '1',
      amenities: [], // empty array
      status: 'available',
      bed_type: 'double',
      view_type: 'garden'
    };
    
    console.log('\n🎯 Frontend data simulation:');
    console.log(JSON.stringify(frontendData, null, 2));
    console.log('🔍 Data types:', Object.keys(frontendData).map(key => `${key}: ${typeof frontendData[key]}`));
    
    const updateResponse = await axios.put('http://localhost:3001/api/admin/rooms/9', frontendData);
    console.log('\n✅ Update successful:', updateResponse.data);
    
  } catch (error) {
    console.error('\n❌ Frontend-style update failed:');
    console.error('Status:', error.response?.status);
    console.error('Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

testFrontendStyleUpdate();