// Create Admin User via API
const BASE_URL = 'http://localhost:3003';

const createAdminUser = async () => {
  try {
    console.log('🔐 Creating Admin User via API...');
    
    // Step 1: Register new user
    console.log('\n📝 Step 1: Registering user...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@hotel.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '0800000000'
      })
    });
    
    if (!registerResponse.ok) {
      const error = await registerResponse.text();
      console.log('Registration response:', error);
      
      // If user already exists, try login instead
      if (error.includes('already exists')) {
        console.log('✅ User already exists, trying login...');
        return await testLogin();
      }
      
      throw new Error(`Registration failed: ${error}`);
    }
    
    const registerData = await registerResponse.json();
    console.log('✅ User registered successfully!');
    console.log('👤 User Info:', {
      id: registerData.user.id,
      email: registerData.user.email,
      role: registerData.user.role
    });
    
    // Note: Since we can't easily modify the database role due to quota limits,
    // let's create instructions for manual role update
    console.log('\n📋 Manual Steps Required:');
    console.log('1. The user has been created with role "user"');
    console.log('2. To make this user an admin, you need to update the database:');
    console.log(`   UPDATE users SET role = 'admin' WHERE email = 'admin@hotel.com';`);
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: admin@hotel.com');
    console.log('   Password: admin123');
    
    return await testLogin();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

const testLogin = async () => {
  try {
    console.log('\n🧪 Testing login...');
    
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
    
    console.log('📡 Login Response Status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login Success!');
      console.log('👤 User Data:', {
        id: loginData.user.id,
        email: loginData.user.email,
        role: loginData.user.role,
        name: `${loginData.user.firstName} ${loginData.user.lastName}`
      });
      console.log('🔑 Token received:', loginData.token ? 'Yes' : 'No');
      
      if (loginData.user.role === 'admin') {
        console.log('🎉 User has admin privileges!');
      } else {
        console.log('⚠️  User role is:', loginData.user.role);
        console.log('💡 Run this SQL to upgrade to admin:');
        console.log(`   UPDATE users SET role = 'admin' WHERE email = 'admin@hotel.com';`);
      }
      
      return loginData;
    } else {
      const error = await loginResponse.text();
      console.log('❌ Login failed:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
};

// Run the script
createAdminUser().then(() => {
  console.log('\n✨ Admin user creation process completed!');
  console.log('\n📱 Next Steps:');
  console.log('1. Use the login credentials above');
  console.log('2. Access admin panel at: http://localhost:3000/admin');
  console.log('3. If needed, update user role to admin in database');
});