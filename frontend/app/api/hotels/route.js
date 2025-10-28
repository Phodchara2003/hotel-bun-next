// Proxy for hotels API
export async function GET(request) {
  try {
    const response = await fetch('http://localhost:5680/api/hotels', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    const data = await response.json();
    return Response.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Hotels API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch hotels',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}