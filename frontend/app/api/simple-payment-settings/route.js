import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5680';

export async function GET(request) {
  try {
    console.log('🔄 API Proxy: Fetching simple payment settings...');
    
    const response = await fetch(`${API_URL}/api/simple-payment-settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('❌ Backend API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch payment settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Payment settings fetched successfully');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Payment settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}