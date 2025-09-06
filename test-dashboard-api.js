// Test Dashboard API
console.log('🧪 Testing Dashboard API...\n');

const API_BASE = 'http://localhost:3002/api';

// Test API endpoint
const testAPI = async (method, endpoint, data = null, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method,
      headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const responseData = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      parsedData = responseData;
    }
    
    return {
      status: response.status,
      success: response.ok,
      data: parsedData
    };
  } catch (error) {
    return {
      status: 0,
      success: false,
      error: error.message
    };
  }
};

// Test dashboard API
const testDashboard = async () => {
  console.log('🔑 Testing Authentication...');
  
  // Login first
  const loginResult = await testAPI('POST', '/auth/login', {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  
  if (!loginResult.success) {
    console.log('❌ Login failed:', loginResult);
    return;
  }
  
  const token = loginResult.data.token;
  console.log('✅ Login successful\n');
  
  console.log('📊 Testing Dashboard API...');
  
  // Test dashboard stats
  console.log('1️⃣ GET /admin/dashboard/stats - Dashboard statistics');
  const statsResult = await testAPI('GET', '/admin/dashboard/stats', null, token);
  console.log('Status:', statsResult.status);
  console.log('Success:', statsResult.success);
  
  if (statsResult.success) {
    console.log('✅ Dashboard stats working!');
    console.log('Stats keys:', Object.keys(statsResult.data.stats || {}));
    console.log('Recent bookings:', statsResult.data.recentBookings?.length || 0);
    console.log('Top hotels:', statsResult.data.topHotels?.length || 0);
  } else {
    console.log('❌ Dashboard stats failed:', statsResult.data);
  }
  
  // Test revenue analytics
  console.log('\n2️⃣ GET /admin/dashboard/revenue - Revenue analytics');
  const revenueResult = await testAPI('GET', '/admin/dashboard/revenue?days=30', null, token);
  console.log('Status:', revenueResult.status);
  console.log('Success:', revenueResult.success);
  
  if (revenueResult.success) {
    console.log('✅ Revenue analytics working!');
    console.log('Daily data points:', revenueResult.data.daily?.length || 0);
  } else {
    console.log('❌ Revenue analytics failed:', revenueResult.data);
  }
  
  // Test user analytics
  console.log('\n3️⃣ GET /admin/dashboard/users-analytics - User analytics');
  const userAnalyticsResult = await testAPI('GET', '/admin/dashboard/users-analytics?days=30', null, token);
  console.log('Status:', userAnalyticsResult.status);
  console.log('Success:', userAnalyticsResult.success);
  
  if (userAnalyticsResult.success) {
    console.log('✅ User analytics working!');
    console.log('Registration data points:', userAnalyticsResult.data.registrations?.length || 0);
    console.log('Total users:', userAnalyticsResult.data.totalUsers);
  } else {
    console.log('❌ User analytics failed:', userAnalyticsResult.data);
  }
  
  // Test hotel performance
  console.log('\n4️⃣ GET /admin/dashboard/hotels-performance - Hotel performance');
  const hotelPerformanceResult = await testAPI('GET', '/admin/dashboard/hotels-performance', null, token);
  console.log('Status:', hotelPerformanceResult.status);
  console.log('Success:', hotelPerformanceResult.success);
  
  if (hotelPerformanceResult.success) {
    console.log('✅ Hotel performance working!');
    console.log('Hotels:', hotelPerformanceResult.data?.length || 0);
  } else {
    console.log('❌ Hotel performance failed:', hotelPerformanceResult.data);
  }
  
  console.log('\n🎉 Dashboard API testing complete!\n');
};

testDashboard();
