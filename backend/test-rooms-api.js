import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin/rooms',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test-token'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('API Response Status:', res.statusCode);
      console.log('Number of room types:', response.data.length);
      
      response.data.forEach(room => {
        console.log(`\nRoom Type: ${room.name}`);
        console.log(`Sub-rooms count: ${room.sub_rooms ? room.sub_rooms.length : 0}`);
        console.log(`Total rooms: ${room.total_rooms}, Available: ${room.available_rooms}`);
        if (room.sub_rooms && room.sub_rooms.length > 0) {
          console.log('First few sub-rooms:');
          room.sub_rooms.slice(0, 3).forEach(sub => {
            console.log(`  - Room ${sub.room_number}: ${sub.status} (Floor ${sub.floor})`);
          });
        }
      });
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.end();