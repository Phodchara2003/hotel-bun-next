import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    console.log('🔍 Forgot password request for:', email);

    if (!email) {
      console.log('❌ No email provided');
      return NextResponse.json(
        { message: 'กรุณากรอกอีเมล' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return NextResponse.json(
        { message: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    console.log('✅ Calling backend forgot-password API...');

    // เรียก backend API โดยตรง
    const backendResponse = await fetch('http://localhost:3001/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    console.log('Backend response status:', backendResponse.status);
    
    const backendData = await backendResponse.json();
    console.log('Backend response data:', backendData);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: backendData.message || 'เกิดข้อผิดพลาดในการส่งคำขอ' },
        { status: backendResponse.status }
      );
    }

    // หากมี resetUrl จาก backend ให้แสดงใน development
    if (backendData.resetUrl) {
      console.log('🔗 Reset URL:', backendData.resetUrl);
    }

    console.log('✅ Forgot password request completed successfully');

    return NextResponse.json(
      { 
        message: backendData.message || 'ส่งอีเมลรีเซ็ตรหัสผ่านเรียบร้อย',
        success: true,
        resetUrl: backendData.resetUrl // ส่งกลับ URL สำหรับ development
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}