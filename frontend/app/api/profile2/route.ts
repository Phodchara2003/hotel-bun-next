import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

export async function GET(request) {
  console.log('🔍 Profile2 GET called');
  
  try {
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Profile loaded via profile2');
      return NextResponse.json(data);
    } else {
      return NextResponse.json({
        success: true,
        profile: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          dateJoined: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('❌ Profile2 GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  console.log('💾 Profile2 POST called - saving profile');
  
  try {
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📦 Request body received:', JSON.stringify(body, null, 2));

    const response = await fetch(`${BACKEND_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    });

    console.log('📡 Backend response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Profile saved successfully via profile2');
      return NextResponse.json(data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to save profile' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Profile2 POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  console.log('💾 Profile2 PUT called');
  return NextResponse.json({ message: 'Profile PUT works' });
}
