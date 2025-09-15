// Proxy for customers API
export async function GET(request) {
  try {
    const response = await fetch('http://localhost:3003/api/customers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return Response.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Customers API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch customers',
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}