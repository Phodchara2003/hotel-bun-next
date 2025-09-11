import { NextResponse } from 'next/server';
import crypto from 'crypto';

// ฟังก์ชันส่งอีเมล (จำลอง)
async function sendResetEmail(email, resetToken) {
  // ในการใช้งานจริง ควรใช้ email service เช่น SendGrid, Nodemailer, etc.
  console.log(`Sending reset email to: ${email}`);
  console.log(`Reset URL: ${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`);
  
  // จำลองการส่งอีเมล - ในการใช้งานจริงให้แทนที่ด้วย email service
  return true;
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'กรุณากรอกอีเมล' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าอีเมลมีอยู่ในระบบหรือไม่
    const userCheckResponse = await fetch(`${process.env.BACKEND_URL}/api/users/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!userCheckResponse.ok) {
      return NextResponse.json(
        { message: 'ไม่พบอีเมลนี้ในระบบ' },
        { status: 404 }
      );
    }

    // สร้าง reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // หมดอายุใน 15 นาที

    // บันทึก reset token ในฐานข้อมูล
    const saveTokenResponse = await fetch(`${process.env.BACKEND_URL}/api/auth/save-reset-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        resetToken,
        resetTokenExpires: resetTokenExpires.toISOString()
      }),
    });

    if (!saveTokenResponse.ok) {
      return NextResponse.json(
        { message: 'เกิดข้อผิดพลาดในการสร้าง token' },
        { status: 500 }
      );
    }

    // ส่งอีเมลรีเซ็ตรหัสผ่าน
    const emailSent = await sendResetEmail(email, resetToken);

    if (!emailSent) {
      return NextResponse.json(
        { message: 'เกิดข้อผิดพลาดในการส่งอีเมล' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'ส่งอีเมลรีเซ็ตรหัสผ่านเรียบร้อย',
        success: true 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' },
      { status: 500 }
    );
  }
}
