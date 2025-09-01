import fetch from 'node-fetch';

async function testAPIEndpoint() {
  try {
    console.log('Testing API endpoint: http://localhost:3001/api/hotels/1');
    
    const response = await fetch('http://localhost:3001/api/hotels/1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('Room types count:', data.roomTypes ? data.roomTypes.length : 0);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    process.exit(0);
  }
}

testAPIEndpoint();
