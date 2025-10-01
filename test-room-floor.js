// ทดสอบการสร้างและแก้ไขห้องพักพร้อมฟิลด์ floor
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function testRoomWithFloor() {
  try {
    console.log('🔐 Testing login...');
    
    // Login first
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@hotel.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test creating room with floor
    console.log('\n🏠 Testing room creation with floor...');
    const newRoomData = {
      hotel_id: 1,
      name: 'ห้องทดสอบชั้น 3 (Test Floor 3 Room)',
      description: 'ห้องทดสอบการบันทึกชั้น',
      price_per_night: 800,
      max_guests: 2,
      size_sqm: 30,
      bed_type: 'double',
      floor: '3', // ทดสอบชั้น 3
      amenities: ['wifi', 'air_conditioning'],
      images: []
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/api/admin/rooms`, newRoomData, { headers });
    console.log('✅ Room created:', createResponse.data);
    
    const roomId = createResponse.data.data?.id;
    if (roomId) {
      // Test updating room floor
      console.log('\n🔄 Testing room update with different floor...');
      const updateData = {
        name: 'ห้องทดสอบชั้น 5 (Updated to Floor 5)',
        floor: '5', // เปลี่ยนเป็นชั้น 5
        price_per_night: 900
      };
      
      const updateResponse = await axios.put(`${API_BASE_URL}/api/admin/rooms/${roomId}`, updateData, { headers });
      console.log('✅ Room updated:', updateResponse.data);
      
      // Get room details to verify floor
      console.log('\n📋 Getting room details to verify floor...');
      const getRoomResponse = await axios.get(`${API_BASE_URL}/api/admin/rooms/${roomId}`, { headers });
      const roomDetails = getRoomResponse.data.data;
      
      console.log('✅ Room details:');
      console.log('- ID:', roomDetails.id);
      console.log('- Name:', roomDetails.name);
      console.log('- Floor:', roomDetails.floor);
      console.log('- Bed Type:', roomDetails.bed_type);
      console.log('- Price:', roomDetails.price_per_night);
      
      // Clean up - delete test room
      console.log('\n🗑️ Cleaning up test room...');
      await axios.delete(`${API_BASE_URL}/api/admin/rooms/${roomId}`, { headers });
      console.log('✅ Test room deleted');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testRoomWithFloor();