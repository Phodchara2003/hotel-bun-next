import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

// POST - Change password
export async function POST(request) {
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
    const response = await fetch(`${BACKEND_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to change password' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
