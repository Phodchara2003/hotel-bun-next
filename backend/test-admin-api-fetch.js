// Test admin users API
import { randomBytes } from 'crypto';

const API_BASE = 'http://localhost:3001';

// Use existing admin token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTY5MTg1NDIsImV4cCI6MTc1NzUyMzM0Mn0.aKrwNnHjyU-7eTzZtpPD5IUWFbaPIfMTvbOAqr2Shbw';

console.log('🔍 Testing admin users API...');

try {
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('Response status:', response.status);
  
  if (response.ok) {
    const data = await response.json();
    console.log('✅ API Response successful');
    console.log('Total users:', data.users.length);
    console.log('Pagination:', data.pagination);
    
    console.log('\n👥 Users:');
    data.users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}, Role: ${user.role}`);
    });
  } else {
    console.log('❌ API Error:', response.status, response.statusText);
    const errorText = await response.text();
    console.log('Error details:', errorText);
  }
} catch (error) {
  console.error('❌ Network Error:', error.message);
}
