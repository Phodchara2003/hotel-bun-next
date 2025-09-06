import fetch from 'node-fetch';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY4NzUwNTgsImV4cCI6MTc1NzQ3OTg1OH0.CEQUI622l5njFYBMpzKAprIjbpeAGD4iZ_yT7IQHq8Y';

async function testRoomsAPI() {
  console.log('🏨 Testing Admin Rooms API...\n');
  
  const endpoints = [
    '/api/admin/rooms',
    '/api/admin/rooms/',
    '/api/rooms'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`Status: ${response.status}`);
      const data = await response.json();
      console.log(`Response:`, JSON.stringify(data, null, 2));
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ Error testing ${endpoint}:`, error.message);
      console.log('---\n');
    }
  }
}

testRoomsAPI();
