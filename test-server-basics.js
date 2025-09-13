const testBasics = async () => {
  console.log('🔍 Testing basic server functionality...');
  
  try {
    // Test the base route
    console.log('\n1. Testing base route...');
    const baseResponse = await fetch('http://localhost:3003/');
    console.log('Base Status:', baseResponse.status);
    const baseText = await baseResponse.text();
    console.log('Base Response:', baseText);
    
    // Test a known working route (payments)
    console.log('\n2. Testing payment settings (known working)...');
    const paymentResponse = await fetch('http://localhost:3003/api/admin/payment-settings');
    console.log('Payment Status:', paymentResponse.status);
    
    // Test if the auth routes are loaded
    console.log('\n3. Testing auth route availability...');
    const authTestResponse = await fetch('http://localhost:3003/api/auth/login', {
      method: 'OPTIONS'
    });
    console.log('Auth OPTIONS Status:', authTestResponse.status);
    
  } catch (error) {
    console.error('Test Error:', error.message);
  }
};

testBasics();