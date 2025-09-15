import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export async function POST(request) {
  try {
    console.log('🔄 API Proxy: Processing payment...');
    
    const body = await request.json();
    
    const response = await fetch(`${API_URL}/api/process-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error('❌ Backend API error:', response.status, response.statusText);
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Failed to process payment', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Payment processed successfully');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Payment processing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}