// Test all API connections between Frontend and Backend
const testAllAPIs = async () => {
  console.log('🧪 Testing All API Connections...\n');
  
  let token = null;
  
  try {
    // 1. Test Authentication API
    console.log('1. 🔐 Testing Authentication API...');
    
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@hotel.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.token;
      console.log('   ✅ POST /api/auth/login - SUCCESS');
      console.log(`   👤 User: ${loginData.user?.email} (${loginData.user?.role})`);
    } else {
      console.log('   ❌ POST /api/auth/login - FAILED');
      return;
    }
    
    // Headers for authenticated requests
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // 2. Test Users API
    console.log('\n2. 👥 Testing Users API...');
    
    const usersResponse = await fetch('http://localhost:3002/api/admin/users', {
      method: 'GET',
      headers: authHeaders
    });
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('   ✅ GET /api/admin/users - SUCCESS');
      console.log(`   📊 Total Users: ${usersData.users?.length || 0}`);
    } else {
      console.log('   ❌ GET /api/admin/users - FAILED');
    }
    
    // 3. Test Hotels API
    console.log('\n3. 🏨 Testing Hotels API...');
    
    const hotelsResponse = await fetch('http://localhost:3002/api/hotels', {
      method: 'GET',
      headers: authHeaders
    });
    
    if (hotelsResponse.ok) {
      const hotelsData = await hotelsResponse.json();
      console.log('   ✅ GET /api/hotels - SUCCESS');
      console.log(`   🏨 Total Hotels: ${hotelsData?.length || 0}`);
    } else {
      console.log('   ❌ GET /api/hotels - FAILED');
    }
    
    // 4. Test Bookings API
    console.log('\n4. 📅 Testing Bookings API...');
    
    const bookingsResponse = await fetch('http://localhost:3002/api/bookings', {
      method: 'GET',
      headers: authHeaders
    });
    
    if (bookingsResponse.ok) {
      const bookingsData = await bookingsResponse.json();
      console.log('   ✅ GET /api/bookings - SUCCESS');
      console.log(`   📅 Total Bookings: ${bookingsData?.length || 0}`);
    } else {
      console.log('   ❌ GET /api/bookings - FAILED');
    }
    
    // 5. Test Admin Dashboard API
    console.log('\n5. 📊 Testing Admin Dashboard API...');
    
    const dashboardResponse = await fetch('http://localhost:3002/api/admin/dashboard/stats', {
      method: 'GET',
      headers: authHeaders
    });
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('   ✅ GET /api/admin/dashboard/stats - SUCCESS');
      console.log(`   📊 Dashboard Data: ${Object.keys(dashboardData).length} metrics`);
    } else {
      console.log('   ❌ GET /api/admin/dashboard/stats - FAILED');
    }
    
    // 6. Test Admin Rooms API
    console.log('\n6. 🛏️ Testing Admin Rooms API...');
    
    const roomsResponse = await fetch('http://localhost:3002/api/admin/rooms', {
      method: 'GET',
      headers: authHeaders
    });
    
    if (roomsResponse.ok) {
      const roomsData = await roomsResponse.json();
      console.log('   ✅ GET /api/admin/rooms - SUCCESS');
      console.log(`   🛏️ Total Rooms: ${roomsData?.rooms?.length || 0}`);
    } else {
      console.log('   ❌ GET /api/admin/rooms - FAILED');
    }
    
    // 7. Test Admin Payments API
    console.log('\n7. 💰 Testing Admin Payments API...');
    
    const paymentsResponse = await fetch('http://localhost:3002/api/admin/payments', {
      method: 'GET',
      headers: authHeaders
    });
    
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      console.log('   ✅ GET /api/admin/payments - SUCCESS');
      console.log(`   💰 Total Payments: ${paymentsData?.length || 0}`);
    } else {
      console.log('   ❌ GET /api/admin/payments - FAILED');
    }
    
    // 8. Test Notifications API
    console.log('\n8. 🔔 Testing Notifications API...');
    
    const notificationsResponse = await fetch('http://localhost:3002/api/notifications', {
      method: 'GET',
      headers: authHeaders
    });
    
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log('   ✅ GET /api/notifications - SUCCESS');
      console.log(`   🔔 Total Notifications: ${notificationsData?.length || 0}`);
    } else {
      console.log('   ❌ GET /api/notifications - FAILED');
    }
    
    // 9. Test Reviews API
    console.log('\n9. ⭐ Testing Reviews API...');
    
    const reviewsResponse = await fetch('http://localhost:3002/api/reviews', {
      method: 'GET',
      headers: authHeaders
    });
    
    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json();
      console.log('   ✅ GET /api/reviews - SUCCESS');
      console.log(`   ⭐ Total Reviews: ${reviewsData?.length || 0}`);
    } else {
      console.log('   ❌ GET /api/reviews - FAILED');
    }
    
    // 10. Test Payment Settings API
    console.log('\n10. ⚙️ Testing Payment Settings API...');
    
    const paymentSettingsResponse = await fetch('http://localhost:3002/api/payment-settings', {
      method: 'GET',
      headers: authHeaders
    });
    
    if (paymentSettingsResponse.ok) {
      const paymentSettingsData = await paymentSettingsResponse.json();
      console.log('   ✅ GET /api/payment-settings - SUCCESS');
      console.log(`   ⚙️ Payment Settings: ${Object.keys(paymentSettingsData).length} settings`);
    } else {
      console.log('   ❌ GET /api/payment-settings - FAILED');
    }
    
    console.log('\n🎉 API Connection Test Complete!');
    console.log('🔗 Frontend (http://localhost:3000) ↔️ Backend (http://localhost:3002)');
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
};

// Run the test
testAllAPIs();
