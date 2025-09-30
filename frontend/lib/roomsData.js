// ข้อมูลห้องพักตามระบบ - มี 2 แบบเท่านั้น: เตียงเดี่ยว กับ เตียงคู่
export const roomsData = [
  {
    id: 1,
    name: "ห้องเตียงคู่ (Double Room)",
    description: "ห้องพักหรูหราพร้อมเตียงคู่ขนาดใหญ่ ตกแต่งด้วยโทนสีอบอุ่น มีผ้าปูที่นอนลายไทยแบบดั้งเดิม ห้องกว้างขวางพร้อมสิ่งอำนวยความสะดวกครบครัน",
    image_url: "/images/rooms/double-room-main.jpg", // รูปเตียงคู่พร้อมผ้าลายไทย
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
    image_url: "/images/rooms/single-room-main.jpg", // รูปเตียงเดี่ยว
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

// ฟังก์ชันสำหรับดึงข้อมูลห้องพักจาก API
export const getRoomsData = async () => {
  try {
    // ใช้ public API สำหรับข้อมูลที่อัพเดตแล้ว พร้อม cache busting
    const timestamp = new Date().getTime();
    const response = await fetch(`/api/rooms?t=${timestamp}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.error('Error fetching rooms from API:', result.error);
      return roomsData; // fallback to static data
    }
  } catch (error) {
    console.error('Error fetching rooms from API:', error);
    return roomsData; // fallback to static data
  }
};

// ฟังก์ชันสำหรับดึงข้อมูลห้องพักตาม ID (async version)
export const getRoomById = async (id) => {
  const rooms = await getRoomsData();
  return rooms.find(room => room.id === parseInt(id));
};

// ฟังก์ชันสำหรับดึงห้องพักที่แนะนำ (async version)
export const getFeaturedRooms = async () => {
  const rooms = await getRoomsData();
  return rooms.filter(room => room.featured || room.available);
};

// Synchronous versions for backward compatibility
export const getRoomsDataSync = () => {
  return roomsData;
};

export const getRoomByIdSync = (id) => {
  return roomsData.find(room => room.id === parseInt(id));
};

export const getFeaturedRoomsSync = () => {
  return roomsData.filter(room => room.featured || room.available);
};