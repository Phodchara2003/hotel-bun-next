// Test room search API
async function testRoomSearch() {
  try {
    console.log('🔍 Testing room search API...');
    
    const response = await fetch('http://localhost:3001/api/rooms/search?checkin=2025-10-05&checkout=2025-10-07&guests=2');
    const data = await response.json();
    
    console.log('\n=== Room Search Test Results ===');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Count:', data.count);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📋 Available Rooms:');
      data.data.forEach((room, index) => {
        console.log(`\n${index + 1}. Room Type ID: ${room.room_type_id}`);
        console.log(`   Name: ${room.room_type_name}`);
        console.log(`   Price: ${room.price_per_night} บาท/คืน`);
        console.log(`   Max Guests: ${room.max_guests} คน`);
        console.log(`   Available Count: ${room.available_rooms || room.available_count} ห้อง`);
        console.log(`   Amenities: ${room.amenities || 'ไม่ระบุ'}`);
      });
    } else {
      console.log('❌ No rooms found');
    }
    
    if (data.debug) {
      console.log('\n🐛 Debug Info:');
      console.log('- Total Found:', data.debug.totalFound);
      console.log('- Valid Rooms:', data.debug.validRooms);
      console.log('- Timestamp:', data.debug.timestamp);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test with global fetch (Node.js 18+)
testRoomSearch();