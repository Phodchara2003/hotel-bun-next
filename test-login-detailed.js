const testLoginDetailed = async () => {
  console.log('🔍 Testing login with detailed logging...');
  
  try {
    const loginData = {
      email: 'admin@hotel.com',
      password: 'admin123'
    };
    
    console.log('Sending login request...');
    console.log('Data:', JSON.stringify(loginData));
    
    const response = await fetch('http://localhost:3003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    // Try with different credentials to see if validation is working
    console.log('\n🔍 Testing with invalid credentials...');
    const invalidResponse = await fetch('http://localhost:3003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid@test.com',
        password: 'wrongpassword'
      })
    });
    
    console.log('Invalid Login Status:', invalidResponse.status);
    const invalidText = await invalidResponse.text();
    console.log('Invalid Login Response:', invalidText);
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
};

testLoginDetailed();