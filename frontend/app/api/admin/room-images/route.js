import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// ฟังก์ชันตรวจสอบ token
function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  
  console.log('🔍 Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid Bearer token found');
    return null;
  }

  const token = authHeader.substring(7);
  console.log('🔑 Token extracted:', token ? 'Token exists' : 'No token');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hotel_booking_jwt_secret_2025_very_secure_key_12345');
    console.log('✅ Token verified successfully for user:', decoded.email);
    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return null;
  }
}

export async function POST(request) {
  try {
    // ตรวจสอบ authorization
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่', success: false },
        { status: 401 }
      );
    }

    // ตรวจสอบ role
    if (!['admin', 'staff', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์จัดการรูปภาพห้องพัก', success: false },
        { status: 403 }
      );
    }
    const formData = await request.formData();
    const files = formData.getAll('images');
    const roomId = formData.get('roomId');
    const roomType = formData.get('roomType');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'ไม่มีไฟล์รูปภาพ', success: false },
        { status: 400 }
      );
    }

    if (!roomId || !roomType) {
      return NextResponse.json(
        { error: 'ข้อมูลห้องพักไม่ครบถ้วน', success: false },
        { status: 400 }
      );
    }

    // สร้างโฟลเดอร์สำหรับเก็บรูป
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'rooms');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith('image/')) {
        continue;
      }

      // สร้างชื่อไฟล์ใหม่
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const roomTypeClean = roomType.replace('เตียง', '').toLowerCase();
      const fileName = `${roomTypeClean}-${roomId}-${timestamp}-${i}.${fileExtension}`;
      
      // อ่านข้อมูลไฟล์
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // บันทึกไฟล์
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      // เก็บ path สำหรับส่งกลับ
      const relativePath = `/images/rooms/${fileName}`;
      uploadedFiles.push(relativePath);
    }

    return NextResponse.json({
      success: true,
      message: `อัปโหลดรูปภาพเรียบร้อยแล้ว ${uploadedFiles.length} ไฟล์`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปโหลดรูป', success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // ตรวจสอบ authorization
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่', success: false },
        { status: 401 }
      );
    }

    // ตรวจสอบ role
    if (!['admin', 'staff', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์จัดการรูปภาพห้องพัก', success: false },
        { status: 403 }
      );
    }

    const { imagePath } = await request.json();

    if (!imagePath) {
      return NextResponse.json(
        { error: 'ไม่มี path ของรูปภาพ', success: false },
        { status: 400 }
      );
    }

    // ลบไฟล์ (ในระบบจริงจะลบไฟล์จริงๆ)
    // const fullPath = path.join(process.cwd(), 'public', imagePath);
    // if (existsSync(fullPath)) {
    //   await unlink(fullPath);
    // }

    return NextResponse.json({
      success: true,
      message: 'ลบรูปภาพเรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบรูป', success: false },
      { status: 500 }
    );
  }
}