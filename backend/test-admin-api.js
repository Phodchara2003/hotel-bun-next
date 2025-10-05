// ทดสอบ admin rooms API
async function testAdminRoomsAPI() {
  try {
    console.log('🔍 Testing admin rooms API...');
    
    const response = await fetch('http://localhost:3001/api/admin/rooms');
    const data = await response.json();
    
    console.log('\n=== Admin Rooms API Results ===');
    console.log('Status:', response.status);
    console.log('Success:', data.success);
    console.log('Count:', data.count);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📋 Room Types with Sub Rooms:');
      data.data.forEach((room, index) => {
        console.log(`\n${index + 1}. ${room.name} (ID: ${room.id})`);
        console.log(`   Bed Type: ${room.bed_type}`);
        console.log(`   Total Rooms: ${room.total_rooms || 0}`);
        console.log(`   Available: ${room.available_rooms || 0}`);
        console.log(`   Occupied: ${room.occupied_rooms || 0}`);
        
        if (room.sub_rooms && room.sub_rooms.length > 0) {
          console.log(`   Sub Rooms: ${room.sub_rooms.length} rooms`);
          console.log(`   Sample: ${room.sub_rooms.slice(0, 5).map(r => r.room_number).join(', ')}${room.sub_rooms.length > 5 ? '...' : ''}`);
        } else {
          console.log('   Sub Rooms: No sub rooms found');
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminRoomsAPI();