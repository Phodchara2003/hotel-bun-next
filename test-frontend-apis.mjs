// ทดสอบ Frontend API functions โดยตรง
console.log('🧪 Testing Frontend API Functions...');

// Import functions จาก frontend
import { getRoomsData } from './frontend/lib/roomsData.js';
import { hotelAPI } from './frontend/lib/api.js';

async function testFrontendAPIs() {
  try {
    console.log('\n1️⃣ Testing getRoomsData()...');
    const roomsData = await getRoomsData();
    console.log('✅ getRoomsData result:', roomsData.length, 'rooms');
    console.log('📋 Room IDs:', roomsData.map(r => `${r.id}: ${r.name}`));
    
    console.log('\n2️⃣ Testing hotelAPI.searchRooms()...');
    const searchParams = {
      checkin: '2025-10-03',
      checkout: '2025-10-04',
      guests: 1
    };
    
    const searchResponse = await hotelAPI.searchRooms(searchParams);
    console.log('✅ searchRooms response:');
    console.log('  - success:', searchResponse.success);
    console.log('  - data exists:', !!searchResponse.data);
    console.log('  - data.data exists:', !!(searchResponse.data && searchResponse.data.data));
    console.log('  - data.data length:', searchResponse.data?.data?.length || 'N/A');
    
    if (searchResponse.success && searchResponse.data?.data) {
      console.log('📋 API Room IDs:', searchResponse.data.data.map(r => `${r.room_type_id}: ${r.room_type_name}`));
      
      console.log('\n3️⃣ Testing room mapping logic...');
      const roomsWithAvailability = roomsData.map(room => {
        const availableRoom = searchResponse.data.data.find(ar => ar.room_type_id === room.id || ar.id === room.id);
        console.log(`🔍 Mapping room ${room.id} (${room.name}):`, availableRoom ? '✅ Found match' : '❌ No match');
        if (availableRoom) {
          console.log(`  - Available count: ${availableRoom.available_count}`);
        }
        return {
          ...room,
          available: availableRoom ? true : false,
          available_count: availableRoom ? availableRoom.available_count : 0
        };
      });
      
      const availableCount = roomsWithAvailability.filter(r => r.available).length;
      console.log(`\n🎯 Final Result: ${availableCount}/${roomsWithAvailability.length} rooms available`);
      
      if (availableCount > 0) {
        console.log('✅ Room search should work in frontend!');
      } else {
        console.log('❌ Room search will show no results in frontend');
      }
    } else {
      console.log('❌ API search failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testFrontendAPIs();