import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';

// GET - Load payment settings
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
    const response = await fetch(`${BACKEND_URL}/api/admin/payment-settings`, {
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
      // Return default settings if no settings found
      return NextResponse.json({
        success: true,
        settings: {
          bankTransfer: {
            enabled: true,
            bankName: 'ธนาคารกสิกรไทย',
            accountName: 'โรงแรมตัวอย่าง จำกัด',
            accountNumber: '123-4-56789-0',
            branchName: 'สาขาสยามพารากอน'
          },
          promptPay: {
            enabled: true,
            phoneNumber: '081-234-5678',
            idNumber: '1234567890123',
            qrCodeUrl: '/qr-codes/promptpay-qr.png'
          }
        }
      });
    }
  } catch (error) {
    console.error('Payment settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save payment settings
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
    const response = await fetch(`${BACKEND_URL}/api/admin/payment-settings`, {
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
    } else if (response.status === 401) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    } else {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to save payment settings' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Payment settings POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
