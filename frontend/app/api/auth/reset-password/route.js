import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token, password, confirmPassword } = await request.json();

    console.log('🔍 Reset password request received');
    console.log('Token provided:', token ? 'Yes' : 'No');
    console.log('Password provided:', password ? 'Yes' : 'No');
    console.log('ConfirmPassword provided:', confirmPassword ? 'Yes' : 'No');
    console.log('📋 Full request data:', { token: token ? 'EXISTS' : 'MISSING', password: password ? 'EXISTS' : 'MISSING', confirmPassword: confirmPassword ? 'EXISTS' : 'MISSING' });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!token || !password || !confirmPassword) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ารหัสผ่านตรงกัน
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      return NextResponse.json(
        { message: 'รหัสผ่านไม่ตรงกัน' },
        { status: 400 }
      );
    }

    // ตรวจสอบความแข็งแกร่งของรหัสผ่าน
    if (password.length < 8) {
      console.log('❌ Password too short');
      return NextResponse.json(
        { message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed, calling backend...');

    const backendPayload = { 
      token, 
      newPassword: password 
    };
    console.log('📤 Sending to backend:', backendPayload);

    // เรียก backend API โดยตรง
    const backendResponse = await fetch('http://localhost:3001/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendPayload),
    });

    console.log('Backend response status:', backendResponse.status);
    
    const backendData = await backendResponse.json();
    console.log('Backend response data:', backendData);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: backendData.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' },
        { status: backendResponse.status }
      );
    }

    console.log('✅ Password reset successful');
    
    return NextResponse.json(
      { 
        message: 'เปลี่ยนรหัสผ่านเรียบร้อย',
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ Reset password error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
