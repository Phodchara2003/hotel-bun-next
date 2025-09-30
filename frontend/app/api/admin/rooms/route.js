import { NextRequest, NextResponse } from 'next/server';
import { syncRoomsData, updateRoom } from '../../rooms/route.js';

// จำลองข้อมูลห้องพัก (ในระบบจริงจะเชื่อมต่อกับฐานข้อมูล)
let roomsData = [
  {
    id: 1,
    name: "ห้องเตียงคู่ (Double Room)",
    description: "ห้องพักหรูหราพร้อมเตียงคู่ขนาดใหญ่ ตกแต่งด้วยโทนสีอบอุ่น มีผ้าปูที่นอนลายไทยแบบดั้งเดิม ห้องกว้างขวางพร้อมสิ่งอำนวยความสะดวกครบครัน",
    image_url: "/images/rooms/double-room-main.jpg",
    images: [
      "/images/rooms/double-room-main.jpg",
      "/images/rooms/double-room-swan.jpg", 
      "/images/rooms/double-room-golden.jpg",
      "/images/rooms/bathroom-modern.jpg"
    ],
    price_per_night: 1800,
    max_occupancy: 2,
    bed_type: "เตียงคู่",
    amenities: [
      "เครื่องปรับอากาศ",
      "ทีวีจอแบน",
      "Wi-Fi ฟรี",
      "โต๊ะทำงาน",
      "ตู้เซฟ",
      "มินิบาร์",
      "ห้องน้ำส่วนตัว",
      "เครื่องทำน้ำร้อน",
      "ผ้าปูที่นอนลายไทยพิเศษ",
      "ผ้าเช็ดตัวเรียงรูปหงส์"
    ],
    available: true,
    featured: true
  },
  {
    id: 2,
    name: "ห้องเตียงเดี่ยว (Single Room)",
    description: "ห้องพักสะดวกสบายสำหรับผู้เดินทางคนเดียv เตียงเดี่ยวขนาดมาตรฐาน ห้องสะอาดสมัยใหม่ พื้นที่เหมาะสมไม่คับแคบ",
    image_url: "/images/rooms/single-room-main.jpg",
    images: [
      "/images/rooms/single-room-main.jpg",
      "/images/rooms/single-room-modern.jpg",
      "/images/rooms/bathroom-modern.jpg"
    ],
    price_per_night: 1200,
    max_occupancy: 1,
    bed_type: "เตียงเดี่ยว",
    amenities: [
      "เครื่องปรับอากาศ",
      "ทีวีจอแบน",
      "Wi-Fi ฟรี",
      "โต๊ะทำงาน",
      "ตู้เซฟ",
      "มินิบาร์",
      "ห้องน้ำส่วนตัว",
      "เครื่องทำน้ำร้อน",
      "ตู้เสื้อผ้า",
      "ผ้าปูที่นอนคุณภาพดี"
    ],
    available: true
  }
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: roomsData
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูล', success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { id, images, image_url } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ไม่มี ID ห้องพัก', success: false },
        { status: 400 }
      );
    }

    // หาห้องที่ต้องการอัปเดต
    const roomIndex = roomsData.findIndex(room => room.id === parseInt(id));
    
    if (roomIndex === -1) {
      return NextResponse.json(
        { error: 'ไม่พบห้องพักที่ระบุ', success: false },
        { status: 404 }
      );
    }

    // อัปเดตข้อมูลรูปภาพ
    roomsData[roomIndex] = {
      ...roomsData[roomIndex],
      images: images || roomsData[roomIndex].images,
      image_url: image_url || images?.[0] || roomsData[roomIndex].image_url
    };

    // ซิงค์ข้อมูลไปยัง public API
    try {
      syncRoomsData([...roomsData]);
    } catch (syncError) {
      console.error('Error syncing data to public API:', syncError);
    }

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลห้องพักเรียบร้อยแล้ว',
      data: roomsData[roomIndex]
    });

  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', success: false },
      { status: 500 }
    );
  }
}