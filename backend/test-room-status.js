// Test Room Status API
import 'dotenv/config';

const API_BASE = 'http://localhost:3002/api';

async function testRoomStatusAPI() {
  console.log('🧪 Testing Room Status API...\n');

  try {
    // 1. Test get all rooms with status
    console.log('1️⃣ Testing GET /room-status - Get all rooms');
    const roomsResponse = await fetch(`${API_BASE}/room-status`);
    const roomsData = await roomsResponse.json();
    
    if (roomsData.success) {
      console.log(`✅ Found ${roomsData.total} rooms`);
      console.log('Sample room:', roomsData.data[0]);
    } else {
      console.log('❌ Failed to get rooms:', roomsData.error);
    }

    // 2. Test room statistics
    console.log('\n2️⃣ Testing GET /room-status/statistics');
    const statsResponse = await fetch(`${API_BASE}/room-status/statistics`);
    const statsData = await statsResponse.json();
    
    if (statsData.success) {
      console.log('✅ Room Statistics:');
      console.log('📊 Total rooms:', statsData.data.total);
      console.log('📈 By status:', statsData.data.byStatus);
      console.log('🏢 By floor:', statsData.data.byFloor.slice(0, 3));
    } else {
      console.log('❌ Failed to get statistics:', statsData.error);
    }

    // 3. Test update room status
    if (roomsData.success && roomsData.data.length > 0) {
      const testRoomId = roomsData.data[0].id;
      
      console.log(`\n3️⃣ Testing PATCH /room-status/${testRoomId}/status`);
      const updateResponse = await fetch(`${API_BASE}/room-status/${testRoomId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'maintenance',
          notes: 'Testing room status update'
        })
      });
      
      const updateData = await updateResponse.json();
      
      if (updateData.success) {
        console.log('✅ Room status updated successfully');
        console.log('📝 Update details:', updateData.data);
      } else {
        console.log('❌ Failed to update room status:', updateData.error);
      }

      // 4. Test quick check-in
      console.log(`\n4️⃣ Testing POST /room-status/${testRoomId}/quick-checkin`);
      
      // First set room to available
      await fetch(`${API_BASE}/room-status/${testRoomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'available' })
      });
      
      const checkinResponse = await fetch(`${API_BASE}/room-status/${testRoomId}/quick-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guestName: 'Test Guest',
          checkOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Testing quick check-in'
        })
      });
      
      const checkinData = await checkinResponse.json();
      
      if (checkinData.success) {
        console.log('✅ Quick check-in successful');
        console.log('🏨 Check-in details:', checkinData.data);
      } else {
        console.log('❌ Quick check-in failed:', checkinData.error);
      }

      // 5. Test quick check-out
      console.log(`\n5️⃣ Testing POST /room-status/${testRoomId}/quick-checkout`);
      
      const checkoutResponse = await fetch(`${API_BASE}/room-status/${testRoomId}/quick-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: 'Testing quick check-out'
        })
      });
      
      const checkoutData = await checkoutResponse.json();
      
      if (checkoutData.success) {
        console.log('✅ Quick check-out successful');
        console.log('🚪 Check-out details:', checkoutData.data);
      } else {
        console.log('❌ Quick check-out failed:', checkoutData.error);
      }
    }

    // 6. Test bulk update
    if (roomsData.success && roomsData.data.length >= 3) {
      const roomIds = roomsData.data.slice(0, 3).map(room => room.id);
      
      console.log(`\n6️⃣ Testing POST /room-status/bulk-update`);
      console.log(`📋 Updating rooms: ${roomIds.join(', ')}`);
      
      const bulkResponse = await fetch(`${API_BASE}/room-status/bulk-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomIds: roomIds,
          status: 'available',
          notes: 'Bulk update test - reset to available'
        })
      });
      
      const bulkData = await bulkResponse.json();
      
      if (bulkData.success) {
        console.log('✅ Bulk update successful');
        console.log('📊 Results:', bulkData.results.map(r => `Room ${r.roomId}: ${r.success ? 'Success' : 'Failed'}`));
      } else {
        console.log('❌ Bulk update failed:', bulkData.error);
      }
    }

    console.log('\n🎉 Room Status API testing completed!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run tests
testRoomStatusAPI();
