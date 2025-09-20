import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET() {
  try {
    console.log('🔄 Proxying GET contact-settings to backend...');
    
    const response = await fetch(`${BACKEND_URL}/api/contact-settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Contact settings fetched from backend:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error proxying contact-settings GET:', error);
    
    // Return fallback data if backend is unavailable
    return NextResponse.json({
      success: true,
      data: {
        phone: '02-123-4567',
        email: 'support@hotel.com',
        address: '',
        website: '',
        facebook: '',
        line: ''
      }
    });
  }
}

export async function PUT(request) {
  try {
    console.log('🔄 Proxying PUT contact-settings to backend...');
    
    const body = await request.json();
    console.log('📤 Sending data to backend:', body);

    const response = await fetch(`${BACKEND_URL}/api/contact-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log('📥 Backend response text:', responseText);

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}, body: ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Error parsing JSON response:', parseError);
      throw new Error(`Invalid JSON response from backend: ${responseText}`);
    }

    console.log('✅ Contact settings updated in backend:', data);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('❌ Error proxying contact-settings PUT:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: `ไม่สามารถอัปเดตข้อมูลติดต่อได้: ${error.message}`
      },
      { status: 500 }
    );
  }
}