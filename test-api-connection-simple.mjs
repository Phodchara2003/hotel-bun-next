// ทดสอบ Room Search API Connection และ Response Structure 
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function testAPIConnection() {
  console.log('🧪 Testing API Connection and Response Structure...');
  
  try {
    console.log('\n1️⃣ Testing Backend API directly...');
    const response = await axios.get(`${API_BASE_URL}/api/rooms/search`, {
      params: {
        checkin: '2025-10-03',
        checkout: '2025-10-04',
        guests: 1
      }
    });
    
    console.log('✅ Backend API Response:');
    console.log('  - Status:', response.status);
    console.log('  - Success:', response.data.success);
    console.log('  - Count:', response.data.count);
    console.log('  - Data length:', response.data.data ? response.data.data.length : 'N/A');
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📋 Available Rooms from Backend:');
      response.data.data.forEach((room, index) => {
        console.log(`  ${index + 1}. ID: ${room.room_type_id} - ${room.room_type_name} (${room.available_count} ห้องว่าง)`);
      });
    }
    
    console.log('\n2️⃣ Testing Frontend API Wrapper...');
    // จำลอง frontend API wrapper
    const api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const searchParams = {
      checkin: '2025-10-03',
      checkout: '2025-10-04',
      guests: 1
    };
    
    const wrapperResponse = await api.get('/rooms/search', { params: searchParams });
    const wrappedResult = {
      success: true,
      data: wrapperResponse.data
    };
    
    console.log('✅ Frontend Wrapper Result:');
    console.log('  - wrappedResult.success:', wrappedResult.success);
    console.log('  - wrappedResult.data exists:', !!wrappedResult.data);
    console.log('  - wrappedResult.data.data exists:', !!(wrappedResult.data && wrappedResult.data.data));
    console.log('  - wrappedResult.data.data length:', wrappedResult.data?.data?.length || 'N/A');
    
    console.log('\n3️⃣ Testing Frontend Room Data...');
    // จำลอง roomsData
    const mockRoomsData = [
      { id: 8, name: "ห้องเตียงเดี่ยว (Single Room)" },
      { id: 10, name: "ห้องเตียงคู่ (Double Room)" }
    ];
    
    console.log('📋 Frontend Rooms Data:');
    mockRoomsData.forEach(room => {
      console.log(`  - ID: ${room.id} - ${room.name}`);
    });
    
    console.log('\n4️⃣ Testing Mapping Logic...');
    if (wrappedResult.success && wrappedResult.data && wrappedResult.data.data) {
      const roomsWithAvailability = mockRoomsData.map(room => {
        const availableRoom = wrappedResult.data.data.find(ar => ar.room_type_id === room.id || ar.id === room.id);
        console.log(`🔍 Mapping ${room.name} (ID: ${room.id}):`, availableRoom ? `✅ Found (${availableRoom.available_count} ห้อง)` : '❌ Not found');
        return {
          ...room,
          available: availableRoom ? true : false,
          available_count: availableRoom ? availableRoom.available_count : 0
        };
      });
      
      const availableRooms = roomsWithAvailability.filter(r => r.available);
      console.log(`\n🎯 Final Result: ${availableRooms.length}/${roomsWithAvailability.length} rooms should be available in frontend`);
      
      if (availableRooms.length > 0) {
        console.log('✅ Frontend should show available rooms!');
        availableRooms.forEach(room => {
          console.log(`  ✅ ${room.name}: ${room.available_count} ห้องว่าง`);
        });
      } else {
        console.log('❌ Frontend will show "No rooms available"');
      }
    } else {
      console.log('❌ Mapping failed - response structure invalid');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPIConnection();