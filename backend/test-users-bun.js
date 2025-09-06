console.log('🧪 Testing Admin Users API with Bun...');

try {
  const response = await fetch('http://localhost:3001/api/admin/users', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY4NzUwNTgsImV4cCI6MTc1NzQ3OTg1OH0.CEQUI622l5njFYBMpzKAprIjbpeAGD4iZ_yT7IQHq8Y',
      'Content-Type': 'application/json'
    }
  });

  console.log('🔍 Response status:', response.status);
  console.log('🔍 Response ok:', response.ok);

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Success! Users data received:');
    console.log('📊 Total users:', data.users?.length || 0);
    console.log('📄 Pagination:', data.pagination);
    
    if (data.users && data.users.length > 0) {
      console.log('\n👥 First few users:');
      data.users.slice(0, 3).forEach(user => {
        console.log(`- ${user.fullName} (${user.email}) - ${user.role}`);
      });
    }
  } else {
    const errorText = await response.text();
    console.log('❌ Error response:', errorText);
  }
  
} catch (error) {
  console.error('❌ Network error:', error.message);
}
