import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5680';

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header missing' },
        { status: 401 }
      );
    }

    // Proxy to backend profile API
    const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });

    if (response.ok) {
      const data = await response.json();
      // Transform backend data format to frontend format
      if (data.success && data.data) {
        const userData = data.data;
        return NextResponse.json({
          success: true,
          profile: {
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            nationalId: userData.national_id || '',
            dateJoined: userData.created_at || new Date().toISOString(),
            role: userData.role || 'guest'
          }
        });
      }
      return NextResponse.json(data);
    } else {
      // Return fallback data if backend fails
      return NextResponse.json({
        success: true,
        profile: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          nationalId: '',
          dateJoined: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Profile API GET error:', error);
    return NextResponse.json({
      success: true,
      profile: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        nationalId: '',
        dateJoined: new Date().toISOString()
      }
    });
  }
}

export async function PUT(req) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header missing' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Proxy to backend profile API
    const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
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
    } else {
      const errorData = await response.text();
      console.error('Backend profile update failed:', errorData);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Profile API PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}