import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    console.log('🔗 Proxy API route called');
    
    // Get authorization header from incoming request
    const authHeader = request.headers.get('authorization');
    console.log('🔑 Authorization header:', authHeader);
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    // Build query string
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(role && { role }),
    });

    // Forward the request to backend
    const backendUrl = `http://localhost:5680/api/admin/users?${queryParams}`;
    console.log('🎯 Forwarding to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    console.log('📥 Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
      return NextResponse.json({ error: `Backend error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Backend data received, users count:', data.users?.length || 0);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Proxy error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
      stack: error.stack
    });
    return NextResponse.json({ error: error.message, details: error.cause }, { status: 500 });
  }
}
