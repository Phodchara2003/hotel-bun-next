import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export async function GET(request) {
  try {
    console.log('🔄 API Proxy: Fetching notifications...');
    
    const response = await fetch(`${API_URL}/api/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('❌ Backend API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Notifications fetched successfully');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Notifications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}