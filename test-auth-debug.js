// Test script to check authentication
console.log('=== Authentication Debug ===');
console.log('localStorage token:', localStorage.getItem('token'));
console.log('localStorage user:', localStorage.getItem('user'));
console.log('localStorage auth_token:', localStorage.getItem('auth_token'));
console.log('localStorage user_data:', localStorage.getItem('user_data'));

// Test API call
async function testAPI() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    console.log('Testing with token:', token);
    
    const response = await fetch('/api/admin/payment-settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response status:', response.status);
    const data = await response.json();
    console.log('API Response data:', data);
  } catch (error) {
    console.error('API Test error:', error);
  }
}

testAPI();
