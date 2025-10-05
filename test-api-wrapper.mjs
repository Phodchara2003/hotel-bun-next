// ทดสอบฟังก์ชัน searchRooms ใน frontend API
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

// จำลอง api client จาก frontend/lib/api.js
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// จำลอง hotelAPI.searchRooms function
const searchRooms = async (searchParams) => {
  try {
    console.log('🔍 Searching rooms with params:', searchParams);
    const response = await api.get('/rooms/search', { params: searchParams });
    console.log('✅ Room search results:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Error searching rooms:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ทดสอบ
async function testSearchRoomsAPI() {
  console.log('🧪 Testing searchRooms API wrapper function...');
  
  const testParams = {
    checkin: '2025-10-05',
    checkout: '2025-10-07',
    guests: 2
  };
  
  try {
    const response = await searchRooms(testParams);
    
    console.log('\n📋 API Response Structure:');
    console.log('- response.success:', response.success);
    console.log('- response.data:', typeof response.data);
    
    if (response.success && response.data) {
      console.log('- response.data.success:', response.data.success);
      console.log('- response.data.count:', response.data.count);
      console.log('- response.data.data:', Array.isArray(response.data.data) ? `Array(${response.data.data.length})` : typeof response.data.data);
      
      // ทดสอบ logic ที่ใช้ใน rooms page
      if (response.data.data && response.data.data.length > 0) {
        console.log('\n✅ Test passed: response.data.data exists and has rooms');
        console.log('🎯 Available room types:');
        response.data.data.forEach((room, index) => {
          console.log(`  ${index + 1}. ${room.room_type_name} (ID: ${room.room_type_id}) - ${room.available_count} rooms`);
        });
      } else {
        console.log('\n❌ Test failed: No room data found');
      }
    } else {
      console.log('\n❌ Test failed: Invalid response structure');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testSearchRoomsAPI();