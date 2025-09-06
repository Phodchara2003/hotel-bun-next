// Test script to verify admin users API
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY4NzUwNTgsImV4cCI6MTc1NzQ3OTg1OH0.CEQUI622l5njFYBMpzKAprIjbpeAGD4iZ_yT7IQHq8Y';

console.log('🚀 Testing Admin Users API from browser...');

fetch('http://localhost:3001/api/admin/users', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  mode: 'cors'
})
.then(response => {
  console.log('📥 Response received:', response);
  console.log('📊 Status:', response.status);
  console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
  return response.json();
})
.then(data => {
  console.log('✅ Success! Data:', data);
})
.catch(error => {
  console.error('❌ Error:', error);
});
