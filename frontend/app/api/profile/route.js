import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3003';

// GET - Load user profile
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      );
    }

    // ส่งต่อ request ไปยัง backend โดยตรง
    const response = await fetch(`${BACKEND_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else if (response.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    } else {
      console.error('Backend profile fetch failed:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // ส่งต่อ request ไปยัง backend โดยตรง
    const response = await fetch(`${BACKEND_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else if (response.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    } else {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to update profile' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
