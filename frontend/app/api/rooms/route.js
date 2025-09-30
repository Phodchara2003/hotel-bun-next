import { NextResponse } from 'next/server';

// ใช้ข้อมูลร่วมกับ admin API
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
    description: "ห้องพักสะดวกสบายสำหรับผู้เดินทางคนเดียว เตียงเดี่ยวขนาดมาตรฐาน ห้องสะอาดสมัยใหม่ พื้นที่เหมาะสมไม่คับแคบ",
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

// ฟังก์ชันสำหรับซิงค์ข้อมูลจาก admin API
export function syncRoomsData(updatedRooms) {
  roomsData = updatedRooms;
}

// ฟังก์ชันสำหรับอัพเดทห้องเดี่ยว
export function updateRoom(roomId, updatedData) {
  const roomIndex = roomsData.findIndex(room => room.id === parseInt(roomId));
  if (roomIndex !== -1) {
    roomsData[roomIndex] = {
      ...roomsData[roomIndex],
      ...updatedData
    };
    return roomsData[roomIndex];
  }
  return null;
}

// GET - ดึงข้อมูลห้องพักทั้งหมด
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: roomsData
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องพัก', success: false },
      { status: 500 }
    );
  }
}