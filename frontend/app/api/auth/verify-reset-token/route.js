import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    console.log('🔍 Verifying reset token:', token ? 'Token provided' : 'No token');

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Token is required' 
        },
        { status: 400 }
      );
    }

    // ตรวจสอบรูปแบบ token (ควรเป็น hex string ความยาว 64 ตัวอักษร)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      console.log('❌ Invalid token format');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid token format' 
        },
        { status: 400 }
      );
    }

    // ในการ implement จริง คุณจะต้องเช็คกับ database
    // สำหรับตอนนี้ เราจะถือว่า token ที่มีรูปแบบถูกต้องและยังไม่หมดอายุ
    // คุณสามารถเก็บ tokens ใน memory, database, หรือ cache
    
    console.log('✅ Token verification successful');
    
    return NextResponse.json({
      success: true,
      message: 'Token is valid',
      data: {
        tokenValid: true
      }
    });

  } catch (error) {
    console.error('❌ Token verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Token verification failed',
        error: error.message 
      },
      { status: 500 }
    );
  }
}