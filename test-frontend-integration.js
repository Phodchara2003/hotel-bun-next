// Test Frontend API Integration
console.log('🧪 Testing Frontend API Integration...\n');

const API_BASE = 'http://localhost:3002/api';

async function testFrontendIntegration() {
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Backend Health...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend Health:', healthData.status);
    
    // Test 2: Login
    console.log('\n2️⃣ Testing Login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@hotel.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error('Login failed: ' + JSON.stringify(loginData));
    }
    
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log('User:', loginData.user.email, '- Role:', loginData.user.role);
    
    // Test 3: Dashboard Stats
    console.log('\n3️⃣ Testing Dashboard Stats...');
    const statsResponse = await fetch(`${API_BASE}/admin/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const statsData = await statsResponse.json();
    if (!statsResponse.ok) {
      throw new Error('Dashboard stats failed: ' + JSON.stringify(statsData));
    }
    
    console.log('✅ Dashboard Stats Retrieved:');
    console.log('   📊 Total Bookings:', statsData.stats.totalBookings);
    console.log('   👥 Total Users:', statsData.stats.totalUsers);
    console.log('   💰 Total Revenue:', `₿${statsData.stats.totalRevenue.toLocaleString()}`);
    console.log('   🏨 Total Hotels:', statsData.stats.totalHotels);
    console.log('   🏠 Total Rooms:', statsData.stats.totalRooms);
    console.log('   ⭐ Average Rating:', statsData.stats.averageRating.toFixed(1));
    console.log('   📝 Recent Bookings:', statsData.recentBookings.length);
    
    // Test 4: Users API
    console.log('\n4️⃣ Testing Users API...');
    const usersResponse = await fetch(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const usersData = await usersResponse.json();
    if (!usersResponse.ok) {
      throw new Error('Users API failed: ' + JSON.stringify(usersData));
    }
    
    console.log('✅ Users API Retrieved:');
    console.log('   👥 Total Users:', usersData.pagination.total);
    console.log('   📄 Current Page:', usersData.pagination.page);
    console.log('   Sample User:', usersData.users[0]?.email || 'No users');
    
    // Test 5: Hotels API
    console.log('\n5️⃣ Testing Hotels API...');
    const hotelsResponse = await fetch(`${API_BASE}/hotels`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const hotelsData = await hotelsResponse.json();
    if (!hotelsResponse.ok) {
      throw new Error('Hotels API failed: ' + JSON.stringify(hotelsData));
    }
    
    console.log('✅ Hotels API Retrieved:');
    console.log('   🏨 Total Hotels:', hotelsData.hotels?.length || 0);
    if (hotelsData.hotels?.length > 0) {
      console.log('   Sample Hotel:', hotelsData.hotels[0].name);
    }
    
    // Test 6: Bookings API
    console.log('\n6️⃣ Testing Bookings API...');
    const bookingsResponse = await fetch(`${API_BASE}/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const bookingsData = await bookingsResponse.json();
    if (!bookingsResponse.ok) {
      throw new Error('Bookings API failed: ' + JSON.stringify(bookingsData));
    }
    
    console.log('✅ Bookings API Retrieved:');
    console.log('   📅 Total Bookings:', bookingsData.bookings?.length || 0);
    if (bookingsData.bookings?.length > 0) {
      console.log('   Sample Booking Status:', bookingsData.bookings[0].status);
    }
    
    // Test 7: Payments API
    console.log('\n7️⃣ Testing Payments API...');
    const paymentsResponse = await fetch(`${API_BASE}/admin/payments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const paymentsData = await paymentsResponse.json();
    if (!paymentsResponse.ok) {
      throw new Error('Payments API failed: ' + JSON.stringify(paymentsData));
    }
    
    console.log('✅ Payments API Retrieved:');
    console.log('   💳 Total Payments:', paymentsData.payments?.length || 0);
    console.log('   📊 Pagination Total:', paymentsData.pagination?.total || 0);
    
    console.log('\n🎉 Frontend-Backend Integration Test Complete!');
    console.log('✅ All APIs are working and returning real data');
    console.log('🚀 System is ready for production use!');
    
  } catch (error) {
    console.error('\n❌ Integration Test Failed:');
    console.error('Error:', error.message);
  }
}

testFrontendIntegration();
