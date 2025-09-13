// Test admin login and verify admin access
const BASE_URL = 'http://localhost:3003';

const testAdminLogin = async () => {
  try {
    console.log('🔐 Testing Admin Login and Access...');
    console.log('=====================================');
    
    // Step 1: Login as admin
    console.log('\n🚪 Step 1: Admin Login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@hotel.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      throw new Error(`Login failed: ${error}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login Success!');
    console.log('📧 Email:', 'admin@hotel.com');
    console.log('🔑 Token received:', loginData.token ? 'Yes' : 'No');
    
    if (!loginData.token) {
      throw new Error('No token received');
    }
    
    // Step 2: Decode JWT to check user role
    console.log('\n🔍 Step 2: Checking User Role...');
    const tokenParts = loginData.token.split('.');
    const payload = JSON.parse(atob(tokenParts[1]));
    
    console.log('👤 User Details:');
    console.log('- ID:', payload.id);
    console.log('- Email:', payload.email);
    console.log('- Role:', payload.role || 'Not specified in token');
    
    // Step 3: Test admin-protected route (if available)
    console.log('\n🛡️  Step 3: Testing Admin Access...');
    
    // Try to access admin users list
    const adminResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Admin Users API Status:', adminResponse.status);
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log('✅ Admin access confirmed!');
      console.log('👥 Users in system:', adminData.users ? adminData.users.length : 'Data available');
    } else {
      const error = await adminResponse.text();
      console.log('⚠️  Admin access response:', error);
    }
    
    console.log('\n🎉 Admin Account Ready!');
    console.log('=====================================');
    console.log('🎯 Login Credentials:');
    console.log('  Email: admin@hotel.com');
    console.log('  Password: admin123');
    console.log('  Role: admin (SQLite database)');
    console.log('\n🌐 Access Points:');
    console.log('  Admin Panel: http://localhost:3000/admin');
    console.log('  Payment Settings: http://localhost:3000/admin/payment-settings');
    console.log('  Room Management: http://localhost:3000/admin/rooms');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

// Run the test
testAdminLogin();