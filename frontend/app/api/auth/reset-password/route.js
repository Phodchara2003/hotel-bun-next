import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { token, password, confirmPassword } = await request.json();

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ารหัสผ่านตรงกัน
    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: 'รหัสผ่านไม่ตรงกัน' },
        { status: 400 }
      );
    }

    // ตรวจสอบความแข็งแกร่งของรหัสผ่าน
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
        { status: 400 }
      );
    }

    // ตรวจสอบ token ในฐานข้อมูล
    const verifyTokenResponse = await fetch(`${process.env.BACKEND_URL}/api/auth/verify-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!verifyTokenResponse.ok) {
      const errorData = await verifyTokenResponse.json();
      return NextResponse.json(
        { message: errorData.message || 'Token ไม่ถูกต้องหรือหมดอายุแล้ว' },
        { status: 400 }
      );
    }

    const { email } = await verifyTokenResponse.json();

    // เข้ารหัสรหัสผ่านใหม่
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // อัพเดทรหัสผ่านในฐานข้อมูล
    const updatePasswordResponse = await fetch(`${process.env.BACKEND_URL}/api/auth/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: hashedPassword,
        token // ส่ง token เพื่อลบออกจากฐานข้อมูลหลังใช้แล้ว
      }),
    });

    if (!updatePasswordResponse.ok) {
      return NextResponse.json(
        { message: 'เกิดข้อผิดพลาดในการอัพเดทรหัสผ่าน' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'เปลี่ยนรหัสผ่านเรียบร้อย',
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
