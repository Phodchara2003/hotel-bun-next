// Test backend directly from external script
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY4NzUwNTgsImV4cCI6MTc1NzQ3OTg1OH0.CEQUI622l5njFYBMpzKAprIjbpeAGD4iZ_yT7IQHq8Y';

console.log('🚀 Testing backend API directly...');

fetch('http://localhost:3001/api/admin/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
})
.then(response => {
  console.log('📥 Response received:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Success! Users data:', data);
  console.log('👥 Users count:', data.users?.length || 0);
})
.catch(error => {
  console.error('❌ Error:', error);
});
