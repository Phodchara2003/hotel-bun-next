// ทดสอบการแก้ไขชั้นห้องพักผ่าน frontend API
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002'; // Frontend URL
const API_ENDPOINT = 'http://localhost:3001'; // Backend URL

async function testFrontendToBackendFloor() {
  try {
    console.log('🔐 Testing frontend to backend floor update...');
    
    // Login first to get token
    const loginResponse = await axios.post(`${API_ENDPOINT}/api/auth/login`, {
      email: 'admin@hotel.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Get existing rooms first
    console.log('\n📋 Getting existing rooms...');
    const roomsResponse = await axios.get(`${API_ENDPOINT}/api/admin/rooms`, { headers });
    const rooms = roomsResponse.data.data;
    
    if (rooms && rooms.length > 0) {
      const firstRoom = rooms[0];
      console.log('🏠 Testing with room ID:', firstRoom.id);
      console.log('📍 Current floor:', firstRoom.floor);
      
      // Test updating floor through frontend-style API call
      console.log('\n🔄 Updating floor through frontend API style...');
      const newFloor = firstRoom.floor === '1' ? '3' : '1'; // Toggle floor
      
      // Simulate how frontend sends data
      const frontendData = {
        name: firstRoom.name,
        description: firstRoom.description,
        price: firstRoom.price_per_night,
        capacity: firstRoom.max_guests,
        bed_type: firstRoom.bed_type,
        floor: newFloor, // The floor we want to update
        amenities: firstRoom.amenities || []
      };
      
      console.log('📤 Sending frontend-style data:', frontendData);
      
      // Call the same endpoint that frontend uses
      const updateResponse = await axios.put(
        `${API_ENDPOINT}/api/admin/rooms/${firstRoom.id}`, 
        {
          name: frontendData.name,
          description: frontendData.description,
          price_per_night: parseFloat(frontendData.price),
          max_guests: parseInt(frontendData.capacity),
          bed_type: frontendData.bed_type,
          floor: frontendData.floor, // Include floor
          amenities: frontendData.amenities
        }, 
        { headers }
      );
      
      console.log('✅ Update response:', updateResponse.data.success);
      
      // Verify the update
      console.log('\n🔍 Verifying update...');
      const verifyResponse = await axios.get(`${API_ENDPOINT}/api/admin/rooms/${firstRoom.id}`, { headers });
      const updatedRoom = verifyResponse.data.data;
      
      console.log('✅ Verification results:');
      console.log('- Room ID:', updatedRoom.id);
      console.log('- Room Name:', updatedRoom.name);
      console.log('- Previous Floor:', firstRoom.floor);
      console.log('- New Floor:', updatedRoom.floor);
      console.log('- Floor updated successfully:', updatedRoom.floor === newFloor ? '✅ YES' : '❌ NO');
      
    } else {
      console.log('❌ No rooms found to test with');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testFrontendToBackendFloor();