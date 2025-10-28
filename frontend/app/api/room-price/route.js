export async function GET(request) {
  try {
    const response = await fetch('http://localhost:5680/global-settings/room_price_per_night', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    const data = await response.json();
    return Response.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Room Price API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch room price',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}