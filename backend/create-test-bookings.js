// Create test bookings for frontend testing
const createTestBookings = async () => {
  const baseURL = 'http://localhost:3001/api/bookings';
  
  const testBookings = [
    {
      hotelId: 1,
      roomTypeId: 1,
      checkInDate: '2025-08-15',
      checkOutDate: '2025-08-17',
      guests: 2,
      specialRequests: 'Late check-in please'
    },
    {
      hotelId: 1,
      roomTypeId: 2,
      checkInDate: '2025-08-20',
      checkOutDate: '2025-08-22',
      guests: 2,
      specialRequests: 'Room with city view'
    },
    {
      hotelId: 1,
      roomTypeId: 3,
      checkInDate: '2025-08-25',
      checkOutDate: '2025-08-28',
      guests: 3,
      specialRequests: 'Anniversary celebration'
    }
  ];
  
  console.log('Creating test bookings...');
  
  for (let i = 0; i < testBookings.length; i++) {
    const booking = testBookings[i];
    console.log(`Creating booking ${i + 1}/3...`);
    
    try {
      const response = await fetch(baseURL, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer fake-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(booking)
      });
      
      const result = await response.json();
      if (response.ok) {
        console.log(`✅ Created booking ID: ${result.booking.id}`);
      } else {
        console.log(`❌ Failed to create booking: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error creating booking ${i + 1}:`, error);
    }
  }
  
  // Check total bookings
  const getAllResponse = await fetch(`${baseURL}/admin/all`, {
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJhZG1pbkByb3lhbGdhcmRlbi5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTYxMTM4MTQsImV4cCI6MTc1NjcxODYxNH0.pG0fEFjUcUOv0tszlZ9qqxf_UNoyJaiWPC0LLXEgTKQ',
      'Content-Type': 'application/json'
    }
  });
  
  const allBookings = await getAllResponse.json();
  console.log(`\nTotal bookings now: ${allBookings.totalBookings}`);
};

createTestBookings();
