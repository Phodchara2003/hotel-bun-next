// Test login with admin credentials
const testLogin = async () => {
  try {
    console.log('Testing admin login...');
    
    const loginData = {
      email: 'admin@royalgarden.com',
      password: 'admin123' // Assuming this is the password
    };
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('Login response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('Token:', data.token ? 'Present' : 'Missing');
      console.log('User:', data.user?.email, '- Role:', data.user?.role);
    } else {
      const errorData = await response.json();
      console.log('❌ Login failed:', errorData.message);
    }
    
  } catch (error) {
    console.error('❌ Error during login test:', error.message);
  }
};

testLogin();
