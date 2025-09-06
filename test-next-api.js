// Direct test of Next.js API route
const testNextAPI = async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY4NzUwNTgsImV4cCI6MTc1NzQ3OTg1OH0.CEQUI622l5njFYBMpzKAprIjbpeAGD4iZ_yT7IQHq8Y';
  
  try {
    console.log('🚀 Testing Next.js API route...');
    
    const response = await fetch('http://localhost:3000/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📄 Response text:', text);
    
    if (text) {
      try {
        const data = JSON.parse(text);
        console.log('✅ Parsed data:', data);
      } catch (e) {
        console.log('❌ Failed to parse JSON:', e);
      }
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
};

testNextAPI();
