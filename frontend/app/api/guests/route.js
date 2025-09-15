// Simple proxy for guest information API
export async function GET(request) {
  try {
    const response = await fetch('http://localhost:3003/api/guests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return Response.json(data, { status: response.status });
    
  } catch (error) {
    console.error('API Proxy Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Backend connection failed',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const response = await fetch('http://localhost:3003/api/guest-information', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return Response.json(data, { status: response.status });
    
  } catch (error) {
    console.error('API Proxy Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Backend connection failed',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}