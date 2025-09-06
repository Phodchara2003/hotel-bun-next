// Simple frontend test to check if admin users API is working
console.log('🚀 Testing admin users frontend integration...');

// Check if we're logged in
const checkAuth = () => {
  const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='));
  const userData = document.cookie.split('; ').find(row => row.startsWith('user_data='));
  
  console.log('🔐 Auth token:', token ? 'Present' : 'Missing');
  console.log('👤 User data:', userData ? 'Present' : 'Missing');
  
  if (userData) {
    try {
      const user = JSON.parse(decodeURIComponent(userData.split('=')[1]));
      console.log('👤 Current user:', user);
      return user;
    } catch (e) {
      console.error('❌ Error parsing user data:', e);
    }
  }
  return null;
};

// Test API call
const testUsersAPI = async () => {
  try {
    console.log('📡 Making API call to /api/admin/users...');
    const response = await fetch('/api/admin/users?page=1&limit=20', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Success! Users:', data.users?.length || 0);
    console.log('📊 Pagination:', data.pagination);
    
    if (data.users) {
      console.log('👥 User list:');
      data.users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.fullName} (${user.email}) - ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Run tests
checkAuth();
testUsersAPI();
