// Test API endpoints for notifications
async function testNotificationAPI() {
  const baseUrl = 'http://localhost:3002';
  
  try {
    console.log('🔍 Testing notification API endpoints...\n');
    
    // Test 1: Get all notifications
    console.log('1. Testing GET /api/notifications');
    const response1 = await fetch(`${baseUrl}/api/notifications?user_id=1`);
    const data1 = await response1.json();
    console.log(`   Status: ${response1.status}`);
    console.log(`   Total notifications: ${data1.notifications?.length || 0}`);
    console.log(`   Unread count: ${data1.summary?.unreadCount || 0}\n`);
    
    // Test 2: Get unread only
    console.log('2. Testing GET /api/notifications?is_read=false');
    const response2 = await fetch(`${baseUrl}/api/notifications?user_id=1&is_read=false`);
    const data2 = await response2.json();
    console.log(`   Status: ${response2.status}`);
    console.log(`   Unread notifications: ${data2.notifications?.length || 0}\n`);
    
    // Test 3: Get by type
    console.log('3. Testing GET /api/notifications?type=booking_confirmed');
    const response3 = await fetch(`${baseUrl}/api/notifications?user_id=1&type=booking_confirmed`);
    const data3 = await response3.json();
    console.log(`   Status: ${response3.status}`);
    console.log(`   Booking confirmed notifications: ${data3.notifications?.length || 0}\n`);
    
    // Test 4: Mark first notification as read (if exists)
    if (data1.notifications && data1.notifications.length > 0) {
      const firstNotification = data1.notifications[0];
      console.log(`4. Testing PUT /api/notifications/${firstNotification.id}/read`);
      const response4 = await fetch(`${baseUrl}/api/notifications/${firstNotification.id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data4 = await response4.json();
      console.log(`   Status: ${response4.status}`);
      console.log(`   Updated: ${data4.success ? 'Yes' : 'No'}\n`);
    }
    
    // Test 5: Get updated unread count
    console.log('5. Testing unread count after marking as read');
    const response5 = await fetch(`${baseUrl}/api/notifications?user_id=1`);
    const data5 = await response5.json();
    console.log(`   Status: ${response5.status}`);
    console.log(`   New unread count: ${data5.summary?.unreadCount || 0}\n`);
    
    console.log('✅ API testing completed successfully!');
    
  } catch (error) {
    console.error('❌ API testing failed:', error);
  }
}

// Run the test
testNotificationAPI();
