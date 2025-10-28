import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5680';

export async function GET(request) {
  try {
    console.log('🔄 API Proxy: Fetching room pricing...');
    
    const response = await fetch(`${API_URL}/global-settings/room_price_per_night`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Backend API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch room pricing' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Room pricing fetched successfully');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Room pricing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}