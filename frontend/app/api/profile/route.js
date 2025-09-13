import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // ส่งข้อมูล profile ตัวอย่าง
    return NextResponse.json({
      success: true,
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    
    // ส่งกลับข้อมูลที่อัปเดตแล้ว
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: body
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}